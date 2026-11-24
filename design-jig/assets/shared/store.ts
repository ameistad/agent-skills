'use client';
// design-jig: live values store. Temporary file, deleted when the jig is locked or discarded.
import { useSyncExternalStore } from 'react';
import { controls } from './controls';
import { normalizeHex } from './color';
import type { Control, JigValue, JigValues } from './types';

export type Values = JigValues<typeof controls>;
export type Key = keyof typeof controls & string;

type Saved = Record<string, { from: JigValue; value: JigValue }>;

const STORAGE_KEY = 'design-jig:values';
const MEMORY_KEY = '__designJigValues';
const isDom = typeof document !== 'undefined';
const all = controls as Record<string, Control>;
export const keys = Object.keys(all) as Key[];

/** CSS custom property for a control key: heroBg -> --jig-hero-bg */
export function cssVarName(key: string): string {
  return '--jig-' + key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

export function sameValue(control: Control, a: JigValue, b: JigValue): boolean {
  if (control.type === 'color' && typeof a === 'string' && typeof b === 'string') {
    return (normalizeHex(a) ?? a) === (normalizeHex(b) ?? b);
  }
  return a === b;
}

function isValid(control: Control, value: unknown): value is JigValue {
  switch (control.type) {
    case 'color':
      return typeof value === 'string' && normalizeHex(value) !== null;
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'select':
      return typeof value === 'string' && control.options.includes(value);
    case 'text':
      return typeof value === 'string';
  }
}

function originals(): Values {
  const out: Record<string, JigValue> = {};
  for (const key of keys) out[key] = all[key].value;
  return out as Values;
}

function readSaved(): Saved {
  const memory = (globalThis as Record<string, unknown>)[MEMORY_KEY];
  if (memory && typeof memory === 'object') return memory as Saved;
  if (!isDom) return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}') as Saved;
  } catch {
    return {};
  }
}

/** Restores saved values, skipping any whose original changed since they were saved. */
function restore(base: Values): Values {
  const saved = readSaved();
  const out: Record<string, JigValue> = { ...base };
  for (const key of keys) {
    const entry = saved[key];
    const control = all[key];
    if (entry && sameValue(control, entry.from, control.value) && isValid(control, entry.value)) {
      out[key] = entry.value;
    }
  }
  return out as Values;
}

function persist() {
  const saved: Saved = {};
  for (const key of keys) saved[key] = { from: all[key].value, value: values[key] };
  (globalThis as Record<string, unknown>)[MEMORY_KEY] = saved;
  if (!isDom) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {
    // Storage can be unavailable (private mode, quota). Values still live in memory.
  }
}

/** Mirrors values to :root custom properties so CSS, Tailwind and server components can read them. */
function applyCssVars() {
  if (!isDom) return;
  const style = document.documentElement.style;
  for (const key of keys) {
    const control = all[key];
    const value = values[key];
    if (control.type === 'text') continue;
    if (control.type === 'number') style.setProperty(cssVarName(key), `${value}${control.unit ?? ''}`);
    else if (control.type === 'boolean') style.setProperty(cssVarName(key), value ? '1' : '0');
    else style.setProperty(cssVarName(key), String(value));
  }
}

const serverValues = originals();
let values: Values = restore(serverValues);
const listeners = new Set<() => void>();
applyCssVars();

function emit() {
  persist();
  applyCssVars();
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getValues(): Values {
  return values;
}

function getServerValues(): Values {
  return serverValues;
}

export function getControl(key: Key): Control {
  return all[key];
}

export function setValue(key: Key, value: JigValue) {
  if (!isValid(all[key], value)) return;
  const next: Record<string, JigValue> = { ...values };
  next[key] = value;
  values = next as Values;
  emit();
}

export function resetValue(key: Key) {
  setValue(key, all[key].value);
}

export function resetAll() {
  values = originals();
  emit();
}

export function isChanged(key: Key): boolean {
  return !sameValue(all[key], values[key], all[key].value);
}

/** Current jig values. Re-renders when any control changes. */
export function useJig(): Values {
  return useSyncExternalStore(subscribe, getValues, getServerValues);
}

export type LockPayload = {
  jig: 'lock';
  changed: Record<string, { from: JigValue; to: JigValue; unit?: string; file?: string }>;
  unchanged: string[];
};

export function buildLock(): { payload: LockPayload; message: string; logLine: string } {
  const payload: LockPayload = { jig: 'lock', changed: {}, unchanged: [] };
  for (const key of keys) {
    const control = all[key];
    if (!isChanged(key)) {
      payload.unchanged.push(key);
      continue;
    }
    payload.changed[key] = {
      from: control.value,
      to: values[key],
      ...(control.type === 'number' && control.unit ? { unit: control.unit } : {}),
      ...(control.file ? { file: control.file } : {}),
    };
  }
  const json = JSON.stringify(payload, null, 2);
  const message =
    'JIG LOCK: bake these values into the code, then remove the jig (design-jig skill).\n\n```json\n' +
    json +
    '\n```';
  return { payload, message, logLine: '[jig:lock] ' + JSON.stringify(payload) };
}
