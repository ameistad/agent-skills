#!/usr/bin/env node
// design preview board: a tiny local server that shows design options side by side
// and returns the user's choice and suggestions to the agent as JSON.
// Zero dependencies. Requires Node.js 18+.
//
//   board.mjs start  --payload <file> [--open] [--port <n>]
//   board.mjs wait   [--key <key>] [--timeout <seconds>]
//   board.mjs update [--key <key>] --payload <file>
//   board.mjs status [--key <key>]
//   board.mjs stop   [--key <key>] [--message <text>]
//   board.mjs schema
//
// Exit codes: 0 ok, 1 usage or payload error, 2 board could not start,
//             3 wait timed out with no answer yet, 4 board is not running.

import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SELF = fileURLToPath(import.meta.url);
const PAGE = path.join(path.dirname(SELF), '..', 'assets', 'board.html');
const SESSIONS = path.join(os.tmpdir(), 'design-board');
const HOLD_MS = 25000; // one long-poll hold; the client loops until its own deadline
const IDLE_MS = 4 * 60 * 60 * 1000;
const MAX_BODY = 32 * 1024 * 1024;
const VIEWPORTS = { desktop: { width: 1280, height: 800 }, mobile: { width: 390, height: 844 } };
const MIME = {
  '.html': 'text/html; charset=utf-8', '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.txt': 'text/plain; charset=utf-8',
};

const SCHEMA = {
  title: 'string, required. What this board is about, e.g. "Pricing cards: three directions".',
  question: 'string, optional. One line saying what the user is deciding.',
  kind: '"directions" | "variants" | "review", optional. "review" shows one or two cards after an update, labels the pick button "Approve" and hides "Show different options".',
  viewport: '"desktop" (1280x800, default) | "mobile" (390x844) | {"width": n, "height": n}. The frame every preview renders in.',
  pickLabel: 'string, optional. Overrides the label of the per-card choose button.',
  allowReroll: 'boolean, optional. Default true, false for kind "review".',
  options: [
    {
      id: 'string, required, unique, letters digits - _ only.',
      name: 'string, required. A short name for the option.',
      summary: 'string, optional. One or two sentences: the idea, not a mood.',
      axis: 'string, optional. What this option varies, e.g. "Layout topology".',
      palette: 'array of CSS colors, optional. Rendered as chips.',
      fonts: 'array of strings, optional.',
      risk: 'string, optional. The honest tradeoff of this option.',
      notes: 'array of strings, optional. Extra lines such as what was changed since last round.',
      reference: 'boolean, optional. True for a card shown only for comparison (such as "Before"). It cannot be chosen.',
      file: 'preview: path to an HTML file, relative to the payload file. Relative assets next to it are served too.',
      html: 'preview: a complete self-contained HTML document as a string.',
      url: 'preview: an http(s) URL, usually the running dev server.',
      image: 'preview: path to an image, relative to the payload file.',
    },
  ],
  _rules: 'One to six options. Each option has at most one of file, html, url, image.',
};

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq > -1) out[a.slice(2, eq)] = a.slice(eq + 1);
      else if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) out[a.slice(2)] = argv[++i];
      else out[a.slice(2)] = true;
    } else out._.push(a);
  }
  return out;
}

function print(obj) { process.stdout.write(JSON.stringify(obj) + '\n'); }
function fail(code, obj) { print({ ok: false, ...obj }); process.exit(code); }

// ---------- payload ----------

function isInside(base, target) {
  const rel = path.relative(base, target);
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
}

function loadPayload(file) {
  if (!file || file === true) throw new Error('--payload <file> is required');
  const abs = path.resolve(file);
  let raw;
  try { raw = JSON.parse(fs.readFileSync(abs, 'utf8')); } catch (e) { throw new Error(`cannot read payload ${abs}: ${e.message}`); }
  const baseDir = fs.realpathSync(path.dirname(abs));
  const errs = [];
  const str = (v) => typeof v === 'string' && v.trim() !== '';
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('payload must be a JSON object');
  if (!str(raw.title)) errs.push('title is required');
  const kind = raw.kind ?? 'directions';
  if (!['directions', 'variants', 'review'].includes(kind)) errs.push('kind must be directions, variants or review');
  let viewport = VIEWPORTS.desktop;
  let viewportName = 'desktop';
  if (typeof raw.viewport === 'string') {
    if (!VIEWPORTS[raw.viewport]) errs.push('viewport must be desktop, mobile or {width, height}');
    else { viewport = VIEWPORTS[raw.viewport]; viewportName = raw.viewport; }
  } else if (raw.viewport && typeof raw.viewport === 'object') {
    const w = Number(raw.viewport.width), h = Number(raw.viewport.height);
    if (!(w >= 240 && w <= 3840 && h >= 240 && h <= 3840)) errs.push('viewport width and height must be between 240 and 3840');
    else { viewport = { width: Math.round(w), height: Math.round(h) }; viewportName = 'custom'; }
  }
  const options = [];
  if (!Array.isArray(raw.options) || raw.options.length < 1 || raw.options.length > 6) errs.push('options must hold one to six entries');
  else {
    const seen = new Set();
    raw.options.forEach((o, i) => {
      const at = `options[${i}]`;
      if (!o || typeof o !== 'object') { errs.push(`${at} must be an object`); return; }
      if (!str(o.id) || !/^[A-Za-z0-9_-]{1,40}$/.test(o.id)) errs.push(`${at}.id is required (letters, digits, - and _)`);
      else if (seen.has(o.id)) errs.push(`${at}.id "${o.id}" is used twice`);
      else seen.add(o.id);
      if (!str(o.name)) errs.push(`${at}.name is required`);
      const kinds = ['file', 'html', 'url', 'image'].filter((k) => o[k] != null);
      if (kinds.length > 1) errs.push(`${at} has more than one preview (${kinds.join(', ')})`);
      const opt = {
        id: o.id, name: o.name,
        summary: str(o.summary) ? o.summary : '', axis: str(o.axis) ? o.axis : '', risk: str(o.risk) ? o.risk : '',
        palette: Array.isArray(o.palette) ? o.palette.filter(str).slice(0, 10) : [],
        fonts: Array.isArray(o.fonts) ? o.fonts.filter(str).slice(0, 6) : [],
        notes: Array.isArray(o.notes) ? o.notes.filter(str).slice(0, 8) : [],
        reference: o.reference === true,
        preview: null,
      };
      const k = kinds[0];
      if (k === 'file' || k === 'image') {
        if (!str(o[k])) errs.push(`${at}.${k} must be a path`);
        else {
          const target = path.resolve(baseDir, o[k]);
          if (!fs.existsSync(target) || !fs.statSync(target).isFile()) errs.push(`${at}.${k} not found: ${target}`);
          else {
            const real = fs.realpathSync(target);
            if (!isInside(baseDir, real)) errs.push(`${at}.${k} must sit inside the payload's folder (${baseDir})`);
            else opt.preview = { kind: k, rel: path.relative(baseDir, real).split(path.sep).join('/') };
          }
        }
      } else if (k === 'html') {
        if (!str(o.html)) errs.push(`${at}.html must be a non-empty string`);
        else opt.preview = { kind: 'html', html: o.html };
      } else if (k === 'url') {
        let ok = false;
        try { ok = ['http:', 'https:'].includes(new URL(o.url).protocol); } catch { /* invalid */ }
        if (!ok) errs.push(`${at}.url must be an http(s) URL`);
        else opt.preview = { kind: 'url', url: o.url };
      }
      options.push(opt);
    });
  }
  if (options.length && options.every((o) => o.reference)) errs.push('at least one option must not be a reference');
  if (errs.length) throw new Error('invalid payload:\n- ' + errs.join('\n- '));
  return {
    baseDir,
    board: {
      title: raw.title, question: str(raw.question) ? raw.question : '', kind,
      viewport, viewportName,
      pickLabel: str(raw.pickLabel) ? raw.pickLabel : (kind === 'review' ? 'Approve' : 'Choose this'),
      allowReroll: typeof raw.allowReroll === 'boolean' ? raw.allowReroll : kind !== 'review',
      options,
    },
  };
}

// ---------- sessions ----------

function sessionFile(key) { return path.join(SESSIONS, `${key}.json`); }
function alive(pid) { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } }

function readSession(key) {
  try {
    const s = JSON.parse(fs.readFileSync(sessionFile(key), 'utf8'));
    if (alive(s.pid)) return s;
    fs.rmSync(sessionFile(key), { force: true });
  } catch { /* missing */ }
  return null;
}

function resolveSession(key) {
  if (key && key !== true) {
    if (!/^[a-f0-9]{8,64}$/.test(key)) return null;
    return readSession(key);
  }
  let names = [];
  try { names = fs.readdirSync(SESSIONS).filter((n) => /^[a-f0-9]+\.json$/.test(n)); } catch { /* none */ }
  const live = names.map((n) => readSession(n.replace(/\.json$/, ''))).filter(Boolean);
  if (live.length === 1) return live[0];
  if (live.length > 1) fail(1, { error: 'several_boards', message: 'Several boards are running. Pass --key.', keys: live.map((s) => s.key) });
  return null;
}

async function agentCall(session, method, route, body) {
  const res = await fetch(`http://127.0.0.1:${session.port}/b/${session.key}/agent/${route}`, {
    method,
    headers: { 'x-design-board-agent': session.agentToken, ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

function openBrowser(url) {
  const cmd = process.platform === 'darwin' ? ['open', [url]]
    : process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]]
    : ['xdg-open', [url]];
  try {
    const child = spawn(cmd[0], cmd[1], { stdio: 'ignore', detached: true });
    child.on('error', () => {});
    child.unref();
    return true;
  } catch { return false; }
}

// ---------- commands ----------

async function cmdStart(args) {
  let loaded;
  try { loaded = loadPayload(args.payload); } catch (e) { fail(1, { error: 'payload_invalid', message: e.message }); }
  fs.mkdirSync(SESSIONS, { recursive: true, mode: 0o700 });
  const key = crypto.randomBytes(8).toString('hex');
  const initFile = path.join(SESSIONS, `${key}.init`);
  const logFile = path.join(SESSIONS, `${key}.log`);
  fs.writeFileSync(initFile, JSON.stringify(loaded), { mode: 0o600 });
  const log = fs.openSync(logFile, 'a', 0o600);
  const child = spawn(process.execPath, [SELF, 'serve', '--key', key, '--port', String(Number(args.port) || 0)], {
    detached: true, stdio: ['ignore', log, log],
    env: { ...process.env, DESIGN_BOARD_AGENT_TOKEN: crypto.randomBytes(16).toString('hex') },
  });
  child.unref();
  fs.closeSync(log);
  const deadline = Date.now() + 6000;
  let session = null;
  while (Date.now() < deadline && !session) {
    await new Promise((r) => setTimeout(r, 80));
    session = readSession(key);
  }
  if (!session) {
    let tail = '';
    try { tail = fs.readFileSync(logFile, 'utf8').trim().split('\n').slice(-3).join(' | '); } catch { /* no log */ }
    fs.rmSync(initFile, { force: true });
    fail(2, { error: 'server_failed', message: 'The board server did not start. Present the options in chat instead.', detail: tail });
  }
  const opened = args.open ? openBrowser(session.url) : false;
  print({ ok: true, key, url: session.url, port: session.port, opened, round: 1 });
}

async function cmdUpdate(args) {
  const session = resolveSession(args.key);
  if (!session) fail(4, { error: 'not_running', message: 'No board is running. Start a new one.' });
  let loaded;
  try { loaded = loadPayload(args.payload); } catch (e) { fail(1, { error: 'payload_invalid', message: e.message }); }
  try {
    const { status, json } = await agentCall(session, 'POST', 'update', loaded);
    if (status !== 200) fail(1, { error: 'update_failed', ...json });
    print({ ok: true, key: session.key, url: session.url, ...json });
  } catch { fail(4, { error: 'not_running', message: 'The board stopped answering.' }); }
}

async function cmdWait(args) {
  const session = resolveSession(args.key);
  if (!session) { print({ type: 'gone', message: 'No board is running.' }); process.exit(4); }
  const seconds = Math.max(1, Number(args.timeout) || 540);
  const deadline = Date.now() + seconds * 1000;
  let last = { pageSeen: false, pageOpen: false };
  for (;;) {
    const hold = Math.min(HOLD_MS, deadline - Date.now());
    if (hold <= 0) break;
    let reply;
    try { reply = await agentCall(session, 'GET', `wait?hold=${hold}`); } catch {
      print({ type: 'gone', message: 'The board stopped answering.' }); process.exit(4);
    }
    const j = reply.json;
    if (j.type === 'answer') { print(j); process.exit(0); }
    if (j.type === 'closed') { print({ type: 'gone', message: 'The board was closed.' }); process.exit(4); }
    last = { pageSeen: !!j.pageSeen, pageOpen: !!j.pageOpen };
  }
  print({ type: 'timeout', ...last, url: session.url, key: session.key });
  process.exit(3);
}

async function cmdStatus(args) {
  const session = resolveSession(args.key);
  if (!session) { print({ ok: true, running: false }); return; }
  try {
    const { json } = await agentCall(session, 'GET', 'status');
    print({ ok: true, running: true, key: session.key, url: session.url, ...json });
  } catch { print({ ok: true, running: false }); }
}

async function cmdStop(args) {
  const session = resolveSession(args.key);
  if (!session) { print({ ok: true, running: false }); return; }
  try {
    await agentCall(session, 'POST', 'stop', { message: typeof args.message === 'string' ? args.message : '' });
  } catch { /* already gone */ }
  print({ ok: true, stopped: true, key: session.key });
}

// ---------- server ----------

function cmdServe(args) {
  const key = String(args.key);
  const agentToken = process.env.DESIGN_BOARD_AGENT_TOKEN || crypto.randomBytes(16).toString('hex');
  const initFile = path.join(SESSIONS, `${key}.init`);
  const first = JSON.parse(fs.readFileSync(initFile, 'utf8'));
  fs.rmSync(initFile, { force: true });

  const rounds = new Map(); // round number -> { baseDir, board }
  let round = 1;
  rounds.set(1, first);
  let status = 'open'; // open | answered | closed
  let pending = null; // answer not yet handed to the agent
  let lastAnswer = null;
  let closeMessage = '';
  let waiters = [];
  let pageSeenAt = 0;
  let lastActivity = Date.now();
  let port = 0;

  const publicBoard = () => {
    const { board } = rounds.get(round);
    return {
      ...board,
      options: board.options.map((o) => {
        let preview = null;
        if (o.preview?.kind === 'file') preview = { kind: 'frame', src: `files/${round}/${encodeURI(o.preview.rel)}`, sandbox: true };
        else if (o.preview?.kind === 'html') preview = { kind: 'frame', src: `inline/${round}/${o.id}`, sandbox: true };
        else if (o.preview?.kind === 'url') preview = { kind: 'frame', src: o.preview.url, sandbox: false };
        else if (o.preview?.kind === 'image') preview = { kind: 'image', src: `files/${round}/${encodeURI(o.preview.rel)}` };
        return { ...o, preview };
      }),
    };
  };

  const send = (res, code, body, headers = {}) => {
    const data = typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body);
    res.writeHead(code, {
      'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store',
      'x-content-type-options': 'nosniff', ...headers,
    });
    res.end(data);
  };

  const readBody = (req) => new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on('data', (c) => { size += c.length; if (size > MAX_BODY) { reject(new Error('too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch (e) { reject(e); } });
    req.on('error', reject);
  });

  const flush = () => {
    if (!pending && status !== 'closed') return;
    const w = waiters.shift();
    if (!w) return;
    clearTimeout(w.timer);
    if (pending) { const a = pending; pending = null; send(w.res, 200, a); } else send(w.res, 200, { type: 'closed' });
    if (status === 'closed') flush();
  };

  const shutdown = () => {
    try { fs.rmSync(sessionFile(key), { force: true }); fs.rmSync(path.join(SESSIONS, `${key}.log`), { force: true }); } catch { /* ignore */ }
    process.exit(0);
  };

  const server = http.createServer(async (req, res) => {
    try {
      const host = String(req.headers.host || '');
      if (host !== `127.0.0.1:${port}` && host !== `localhost:${port}`) return send(res, 403, { error: 'bad host' });
      const url = new URL(req.url, `http://127.0.0.1:${port}`);
      const prefix = `/b/${key}`;
      if (url.pathname === prefix) { res.writeHead(302, { location: `${prefix}/` }); return res.end(); }
      if (!url.pathname.startsWith(prefix + '/')) return send(res, 404, { error: 'not found' });
      const rest = url.pathname.slice(prefix.length + 1);
      lastActivity = Date.now();

      // ----- agent API -----
      if (rest.startsWith('agent/')) {
        if (req.headers['x-design-board-agent'] !== agentToken) return send(res, 403, { error: 'forbidden' });
        const route = rest.slice(6);
        const pageOpen = () => Date.now() - pageSeenAt < 6000;
        if (route === 'status' && req.method === 'GET') {
          return send(res, 200, { round, status, pageSeen: pageSeenAt > 0, pageOpen: pageOpen(), answerPending: !!pending, lastAnswer });
        }
        if (route === 'wait' && req.method === 'GET') {
          if (pending) { const a = pending; pending = null; return send(res, 200, a); }
          if (status === 'closed') return send(res, 200, { type: 'closed' });
          const hold = Math.min(HOLD_MS, Math.max(100, Number(url.searchParams.get('hold')) || HOLD_MS));
          const w = { res, timer: null };
          w.timer = setTimeout(() => {
            waiters = waiters.filter((x) => x !== w);
            send(res, 200, { type: 'timeout', pageSeen: pageSeenAt > 0, pageOpen: pageOpen() });
          }, hold);
          req.on('close', () => { clearTimeout(w.timer); waiters = waiters.filter((x) => x !== w); });
          waiters.push(w);
          return;
        }
        if (route === 'update' && req.method === 'POST') {
          if (status === 'closed') return send(res, 409, { message: 'board is closed' });
          const body = await readBody(req);
          if (!body?.board?.options || !body.baseDir) return send(res, 400, { message: 'bad update' });
          round += 1; rounds.set(round, body); status = 'open'; pending = null;
          return send(res, 200, { round, pageOpen: pageOpen() });
        }
        if (route === 'stop' && req.method === 'POST') {
          const body = await readBody(req).catch(() => ({}));
          closeMessage = typeof body.message === 'string' ? body.message.slice(0, 500) : '';
          status = 'closed';
          send(res, 200, { ok: true });
          flush();
          setTimeout(shutdown, 4000);
          return;
        }
        return send(res, 404, { error: 'not found' });
      }

      // ----- page -----
      if (rest === '' && req.method === 'GET') {
        return send(res, 200, fs.readFileSync(PAGE), {
          'content-type': 'text/html; charset=utf-8', 'referrer-policy': 'no-referrer',
        });
      }
      if (rest === 'state' && req.method === 'GET') {
        pageSeenAt = Date.now();
        return send(res, 200, { round, status, board: publicBoard(), closeMessage, lastAnswer });
      }
      if (rest === 'answer' && req.method === 'POST') {
        if (req.headers['x-design-board'] !== '1' || !String(req.headers['content-type'] || '').startsWith('application/json')) return send(res, 403, { message: 'forbidden' });
        const body = await readBody(req);
        if (status !== 'open' || body.round !== round) return send(res, 409, { message: 'This round is no longer open. The board will refresh.' });
        const { board } = rounds.get(round);
        const action = body.action;
        if (!['pick', 'revise', 'reroll'].includes(action)) return send(res, 400, { message: 'unknown action' });
        const option = board.options.find((o) => o.id === body.optionId) || null;
        if (action === 'pick' && (!option || option.reference)) return send(res, 400, { message: 'unknown option' });
        if (action === 'reroll' && !board.allowReroll) return send(res, 400, { message: 'not available on this board' });
        const suggestion = typeof body.suggestion === 'string' ? body.suggestion.trim().slice(0, 8000) : '';
        const notes = {};
        if (body.notes && typeof body.notes === 'object') {
          for (const o of board.options) {
            const n = body.notes[o.id];
            if (typeof n === 'string' && n.trim()) notes[o.id] = n.trim().slice(0, 4000);
          }
        }
        if (action === 'revise' && !suggestion && !Object.keys(notes).length) return send(res, 400, { message: 'Write a suggestion or a note first.' });
        const answer = {
          type: 'answer', round, action,
          optionId: action === 'pick' ? option.id : null,
          optionName: action === 'pick' ? option.name : null,
          suggestion, notes,
          viewport: typeof body.viewport === 'string' ? body.viewport.slice(0, 20) : board.viewportName,
        };
        status = 'answered'; pending = answer; lastAnswer = answer;
        send(res, 200, { ok: true });
        flush();
        return;
      }
      if (rest.startsWith('inline/') && req.method === 'GET') {
        const [, r, id] = rest.split('/');
        const entry = rounds.get(Number(r));
        const opt = entry?.board.options.find((o) => o.id === id);
        if (opt?.preview?.kind !== 'html') return send(res, 404, { error: 'not found' });
        return send(res, 200, opt.preview.html, { 'content-type': 'text/html; charset=utf-8' });
      }
      if (rest.startsWith('files/') && req.method === 'GET') {
        const parts = rest.split('/');
        const entry = rounds.get(Number(parts[1]));
        if (!entry) return send(res, 404, { error: 'not found' });
        let rel;
        try { rel = decodeURIComponent(parts.slice(2).join('/')); } catch { return send(res, 400, { error: 'bad path' }); }
        const target = path.resolve(entry.baseDir, rel);
        let real;
        try { real = fs.realpathSync(target); } catch { return send(res, 404, { error: 'not found' }); }
        if (!isInside(entry.baseDir, real) || !fs.statSync(real).isFile()) return send(res, 404, { error: 'not found' });
        const type = MIME[path.extname(real).toLowerCase()] || 'application/octet-stream';
        res.writeHead(200, {
          'content-type': type, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff',
          'access-control-allow-origin': '*', // sandboxed previews have an opaque origin; fonts and modules need CORS
        });
        return fs.createReadStream(real).pipe(res);
      }
      return send(res, 404, { error: 'not found' });
    } catch (e) {
      try { send(res, 500, { message: String(e?.message || e) }); } catch { /* response already sent */ }
    }
  });

  server.on('error', (e) => { console.error(`board server error: ${e.message}`); process.exit(1); });
  server.listen(Number(args.port) || 0, '127.0.0.1', () => {
    port = server.address().port;
    const session = { key, port, pid: process.pid, agentToken, url: `http://127.0.0.1:${port}/b/${key}/`, startedAt: new Date().toISOString() };
    fs.writeFileSync(sessionFile(key), JSON.stringify(session), { mode: 0o600 });
  });
  setInterval(() => { if (Date.now() - lastActivity > IDLE_MS) shutdown(); }, 60000).unref();
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

// ---------- main ----------

const [major] = process.versions.node.split('.').map(Number);
if (major < 18) fail(2, { error: 'node_too_old', message: `Node.js 18 or newer is required, found ${process.versions.node}.` });

const args = parseArgs(process.argv.slice(2));
const command = args._[0];
const commands = { start: cmdStart, update: cmdUpdate, wait: cmdWait, status: cmdStatus, stop: cmdStop, serve: cmdServe };
if (command === 'schema') print(SCHEMA);
else if (commands[command]) Promise.resolve(commands[command](args)).catch((e) => fail(1, { error: 'unexpected', message: String(e?.message || e) }));
else fail(1, { error: 'usage', message: 'Commands: start, wait, update, status, stop, schema. See references/board.md.' });
