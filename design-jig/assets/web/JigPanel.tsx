'use client';
// design-jig: dev-only tweak panel for React on the web. Temporary file, deleted when the jig is locked or discarded.
// Renders inside a shadow root so the app's CSS cannot restyle the panel and the panel cannot leak styles.
import { useCallback, useEffect, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { contrastLabel, contrastRatio, hexToHsl, hslToHex, normalizeHex } from './color';
import type { Hsl } from './color';
import { buildLock, getControl, keys, resetAll, resetValue, sameValue, setValue, useJig } from './store';
import type { Key, Values } from './store';
import type { ColorControl, JigValue, NumberControl, SelectControl, TextControl } from './types';

export function JigPanel() {
  const [shadow, setShadow] = useState<ShadowRoot | null>(null);
  const hostRef = useCallback((node: HTMLDivElement | null) => {
    if (node) setShadow(node.shadowRoot ?? node.attachShadow({ mode: 'open' }));
  }, []);
  return (
    <div ref={hostRef} data-design-jig="" style={{ all: 'initial' }}>
      {shadow && createPortal(<Panel />, shadow)}
    </div>
  );
}

function Panel() {
  const values = useJig();
  const [hidden, setHidden] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [dockLeft, setDockLeft] = useState(false);
  const [lock, setLock] = useState<{ message: string; status: string } | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey && event.code === 'KeyJ') {
        event.preventDefault();
        setHidden((h) => !h);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (hidden) return null;

  const changedCount = keys.filter((k) => !sameValue(getControl(k), values[k], getControl(k).value)).length;

  const onLock = async () => {
    const { message, logLine, payload } = buildLock();
    console.log(logLine);
    let status = Object.keys(payload.changed).length
      ? 'Copied. Paste it into your agent chat.'
      : 'Nothing changed. Paste this to remove the jig and keep the original values.';
    try {
      await navigator.clipboard.writeText(message);
    } catch {
      status = 'Could not copy automatically. Select the text below, copy it, and paste it into your agent chat.';
    }
    setLock({ message, status });
  };

  return (
    <>
      <style>{CSS}</style>
      <section className={dockLeft ? 'panel left' : 'panel'} aria-label="Design jig">
        <header>
          <span className="title">Design jig</span>
          <span className="muted">{changedCount ? `${changedCount} changed` : 'Alt+J hides'}</span>
          <button title="Dock on the other side" onClick={() => setDockLeft((d) => !d)}>
            ⇆
          </button>
          <button title={collapsed ? 'Expand' : 'Collapse'} onClick={() => setCollapsed((c) => !c)}>
            {collapsed ? '+' : '–'}
          </button>
        </header>
        {!collapsed && (
          <>
            <div className="body">
              {keys.length === 0 && <p className="muted">No controls yet. Add them in __jig__/controls.ts.</p>}
              {groupKeys().map(([group, groupKeys]) => (
                <div key={group || '_'}>
                  {group && <div className="group">{group}</div>}
                  {groupKeys.map((k) => (
                    <Row key={k} k={k} values={values} />
                  ))}
                </div>
              ))}
            </div>
            {lock && (
              <div className="lockbox">
                <p>{lock.status}</p>
                <textarea readOnly value={lock.message} onFocus={(e) => e.currentTarget.select()} />
                <button onClick={() => setLock(null)}>Close</button>
              </div>
            )}
            <footer>
              <button onClick={() => resetAll()} disabled={!changedCount}>
                Reset
              </button>
              <button className="primary" onClick={() => void onLock()} title="Copy the chosen values for your agent">
                Lock
              </button>
            </footer>
          </>
        )}
      </section>
    </>
  );
}

function groupKeys(): [string, Key[]][] {
  const groups = new Map<string, Key[]>();
  for (const k of keys) {
    const group = getControl(k).group ?? '';
    groups.set(group, [...(groups.get(group) ?? []), k]);
  }
  return [...groups.entries()];
}

function Row({ k, values }: { k: Key; values: Values }) {
  const control = getControl(k);
  const value: JigValue = values[k];
  const changed = !sameValue(control, value, control.value);
  const onChange = (next: JigValue) => setValue(k, next);
  const otherKey = control.type === 'color' ? control.contrastWith : undefined;
  const other = otherKey && otherKey in values ? String(values[otherKey as Key]) : undefined;
  return (
    <div className="row">
      <div className="label" title={control.file ? `${k} in ${control.file}` : k}>
        {changed && <i className="dot" />}
        <span>{control.label ?? k}</span>
        {changed && (
          <button className="mini" title={`Reset to ${String(control.value)}`} onClick={() => resetValue(k)}>
            ↺
          </button>
        )}
      </div>
      {control.type === 'color' && <ColorField control={control} value={String(value)} other={other} onChange={onChange} />}
      {control.type === 'number' && <NumberField control={control} value={Number(value)} onChange={onChange} />}
      {control.type === 'boolean' && (
        <button role="switch" className="switch" aria-checked={Boolean(value)} onClick={() => onChange(!value)} />
      )}
      {control.type === 'select' && <SelectField control={control} value={String(value)} onChange={onChange} />}
      {control.type === 'text' && <TextField control={control} value={String(value)} onChange={onChange} />}
    </div>
  );
}

function ColorField(props: { control: ColorControl; value: string; other?: string; onChange: (v: string) => void }) {
  const { control, value, other, onChange } = props;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [memo, setMemo] = useState<Hsl | null>(null);
  const hex = normalizeHex(value) ?? '#000000';
  // Remember hue and saturation while dragging so they survive black, white and gray.
  const hsl = memo && hslToHex(memo, hex) === hex ? memo : hexToHsl(hex);
  const setHsl = (next: Hsl) => {
    setMemo(next);
    onChange(hslToHex(next, hex));
  };
  const commit = () => {
    if (draft === null) return;
    const next = normalizeHex(draft);
    if (next) onChange(next);
    setDraft(null);
  };
  const ratio = other ? contrastRatio(hex, other) : null;
  const lightness = Math.round(hsl.l * 100);
  return (
    <div>
      <div className="line">
        <input type="color" aria-label="Pick color" value={hex.slice(0, 7)} onChange={(e) => onChange(e.target.value + hex.slice(7))} />
        <input
          type="text"
          className="grow mono"
          spellCheck={false}
          value={draft ?? hex}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
        <button title="Color wheel" aria-pressed={open} onClick={() => setOpen((o) => !o)}>
          ◎
        </button>
      </div>
      {open && (
        <>
          <Wheel hsl={hsl} onChange={setHsl} />
          <div className="line">
            <span className="muted">L</span>
            <input
              type="range"
              className="grow"
              min={0}
              max={100}
              step={1}
              value={lightness}
              style={{ background: `linear-gradient(to right, #000, ${hslToHex({ ...hsl, l: 0.5 })}, #fff)` }}
              onChange={(e) => setHsl({ ...hsl, l: Number(e.target.value) / 100 })}
            />
            <span className="mono num">{lightness}%</span>
          </div>
        </>
      )}
      {control.presets && control.presets.length > 0 && (
        <div className="swatches">
          {control.presets.map((preset) => (
            <button
              key={preset}
              className="swatch"
              title={preset}
              style={{ background: preset }}
              aria-pressed={normalizeHex(preset) === hex}
              onClick={() => {
                const next = normalizeHex(preset);
                if (next) {
                  setMemo(null);
                  onChange(next);
                }
              }}
            />
          ))}
        </div>
      )}
      {ratio !== null && other && <Contrast ratio={ratio} bg={hex} fg={other} />}
    </div>
  );
}

function Wheel({ hsl, onChange }: { hsl: Hsl; onChange: (next: Hsl) => void }) {
  // Near white or black every hue looks the same, so the wheel shows (and picks at) a clamped lightness.
  const wheelL = Math.min(0.85, Math.max(0.15, hsl.l));
  const l = Math.round(wheelL * 100);
  const stops = [0, 60, 120, 180, 240, 300, 360].map((h) => `hsl(${h} 100% ${l}%)`).join(', ');
  const pick = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const r = rect.width / 2;
    const dx = event.clientX - rect.left - r;
    const dy = event.clientY - rect.top - r;
    const h = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
    onChange({ h, s: Math.min(1, Math.hypot(dx, dy) / r), l: wheelL });
  };
  const angle = (hsl.h * Math.PI) / 180;
  return (
    <div
      className="wheel"
      style={{ background: `radial-gradient(closest-side, hsl(0 0% ${l}%), transparent), conic-gradient(${stops})` }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        pick(e);
      }}
      onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && pick(e)}
    >
      <span
        className="marker"
        style={{
          left: `${50 + 50 * hsl.s * Math.sin(angle)}%`,
          top: `${50 - 50 * hsl.s * Math.cos(angle)}%`,
          background: hslToHex(hsl),
        }}
      />
    </div>
  );
}

function Contrast({ ratio, bg, fg }: { ratio: number; bg: string; fg: string }) {
  const label = contrastLabel(ratio);
  const color = label === 'Fail' ? '#f87171' : label === 'AA large' ? '#fbbf24' : '#4ade80';
  return (
    <div className="line contrast">
      <span className="chip" style={{ background: bg, color: fg }}>
        Aa
      </span>
      <span className="mono">{ratio.toFixed(2)}:1</span>
      <span className="badge" style={{ color, borderColor: color }}>
        {label}
      </span>
    </div>
  );
}

function defaultStep({ min, max }: NumberControl): number {
  const span = max - min;
  return span >= 20 ? 1 : span >= 2 ? 0.1 : 0.01;
}

function snap(value: number, min: number, step: number): number {
  const decimals = (String(step).split('.')[1] ?? '').length;
  return Number((Math.round((value - min) / step) * step + min).toFixed(decimals));
}

function NumberField({ control, value, onChange }: { control: NumberControl; value: number; onChange: (v: number) => void }) {
  const step = control.step ?? defaultStep(control);
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    const next = Number(draft);
    if (draft.trim() !== '' && Number.isFinite(next)) onChange(next);
    setDraft(null);
  };
  return (
    <div className="line">
      <input
        type="range"
        className="grow"
        min={control.min}
        max={control.max}
        step={step}
        value={value}
        onChange={(e) => onChange(snap(Number(e.target.value), control.min, step))}
      />
      <input
        type="text"
        inputMode="decimal"
        className="num mono"
        value={draft ?? String(value)}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            setDraft(null);
            onChange(snap(value + (e.key === 'ArrowUp' ? step : -step), control.min, step));
          }
        }}
      />
      {control.unit && <span className="muted">{control.unit}</span>}
    </div>
  );
}

function SelectField({ control, value, onChange }: { control: SelectControl; value: string; onChange: (v: string) => void }) {
  const segmented = control.options.length <= 4 && control.options.every((o) => o.length <= 12);
  if (!segmented) {
    return (
      <select className="grow" value={value} onChange={(e) => onChange(e.target.value)}>
        {control.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }
  return (
    <div className="seg">
      {control.options.map((option) => (
        <button key={option} aria-pressed={option === value} onClick={() => onChange(option)}>
          {option}
        </button>
      ))}
    </div>
  );
}

function TextField({ control, value, onChange }: { control: TextControl; value: string; onChange: (v: string) => void }) {
  return control.multiline ? (
    <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} />
  ) : (
    <input type="text" className="grow" value={value} onChange={(e) => onChange(e.target.value)} />
  );
}

const CSS = `
*, *::before, *::after { box-sizing: border-box; }
.panel { position: fixed; top: 12px; right: 12px; z-index: 2147483647; width: 300px; max-height: calc(100vh - 24px);
  display: flex; flex-direction: column; overflow: hidden; color-scheme: dark;
  background: rgba(24, 24, 27, 0.96); color: #e4e4e7; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35); font: 12px/1.4 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
.panel.left { right: auto; left: 12px; }
header { display: flex; align-items: center; gap: 6px; padding: 8px 10px 8px 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); }
.title { font-weight: 600; flex: 1; }
.muted { color: #a1a1aa; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.body { overflow: auto; padding: 0 12px 8px; flex: 1; }
.group { margin-top: 12px; font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; color: #71717a; }
.row { padding: 9px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
.label { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; min-height: 20px; }
.label span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dot { width: 6px; height: 6px; border-radius: 50%; background: #60a5fa; flex: none; }
.line { display: flex; align-items: center; gap: 6px; }
.grow { flex: 1; min-width: 0; }
.num { width: 56px; text-align: right; }
button { font: inherit; color: inherit; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px; padding: 3px 8px; cursor: pointer; }
button:hover { background: rgba(255, 255, 255, 0.14); }
button:disabled { opacity: 0.4; cursor: default; }
button[aria-pressed="true"] { background: rgba(255, 255, 255, 0.18); }
button.mini { padding: 0 6px; }
button.primary { background: #2563eb; border-color: #2563eb; color: #fff; font-weight: 600; }
button.primary:hover { background: #1d4ed8; }
input[type="text"], select, textarea { font: inherit; color: inherit; background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 6px; padding: 4px 6px; }
textarea { width: 100%; resize: vertical; }
input:focus-visible, select:focus-visible, textarea:focus-visible, button:focus-visible { outline: 2px solid #60a5fa; outline-offset: 1px; }
input[type="range"] { -webkit-appearance: none; appearance: none; height: 6px; margin: 0; border-radius: 3px; background: rgba(255, 255, 255, 0.15); }
input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: #fff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.4); cursor: pointer; }
input[type="range"]::-moz-range-thumb { width: 14px; height: 14px; border: 0; border-radius: 50%; background: #fff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.4); cursor: pointer; }
input[type="color"] { width: 28px; height: 24px; padding: 0; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 6px; background: none; cursor: pointer; flex: none; }
input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
input[type="color"]::-webkit-color-swatch { border: none; border-radius: 5px; }
input[type="color"]::-moz-color-swatch { border: none; border-radius: 5px; }
.wheel { position: relative; width: 176px; height: 176px; margin: 10px auto; border-radius: 50%; touch-action: none; cursor: crosshair; }
.marker { position: absolute; width: 14px; height: 14px; margin: -7px 0 0 -7px; border-radius: 50%; border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5); pointer-events: none; }
.swatches { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
.swatch { width: 18px; height: 18px; padding: 0; border-radius: 4px; border: 1px solid rgba(255, 255, 255, 0.2); }
.swatch[aria-pressed="true"] { outline: 2px solid #fff; outline-offset: 1px; }
.contrast { margin-top: 6px; }
.chip { padding: 1px 6px; border-radius: 4px; font-weight: 600; border: 1px solid rgba(255, 255, 255, 0.15); }
.badge { font-size: 10px; padding: 0 5px; border: 1px solid; border-radius: 4px; }
.seg { display: flex; gap: 2px; padding: 2px; border-radius: 7px; background: rgba(0, 0, 0, 0.35); }
.seg button { flex: 1; border: 0; background: transparent; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.seg button[aria-pressed="true"] { background: rgba(255, 255, 255, 0.16); }
.switch { position: relative; width: 32px; height: 18px; padding: 0; border-radius: 9px; }
.switch::after { content: ""; position: absolute; top: 1px; left: 1px; width: 14px; height: 14px; border-radius: 50%; background: #fff; transition: transform 0.15s; }
.switch[aria-checked="true"] { background: #2563eb; border-color: #2563eb; }
.switch[aria-checked="true"]::after { transform: translateX(14px); }
.lockbox { padding: 10px 12px; border-top: 1px solid rgba(255, 255, 255, 0.08); display: grid; gap: 6px; }
.lockbox p { margin: 0; }
.lockbox textarea { height: 120px; font: 11px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; }
footer { display: flex; gap: 6px; padding: 10px 12px; border-top: 1px solid rgba(255, 255, 255, 0.08); }
footer .primary { flex: 1; }
`;
