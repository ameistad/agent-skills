// design-jig: dev-only tweak panel for React Native (also runs on Expo web). Temporary file, deleted when the jig
// is locked or discarded. Uses only react-native core components, so it needs no install and no native rebuild.
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import type { GestureResponderEvent, LayoutChangeEvent, PanResponderGestureState } from 'react-native';
import { contrastLabel, contrastRatio, hexToHsl, hslToHex, normalizeHex, readableOn } from './color';
import type { Hsl } from './color';
import { buildLock, getControl, keys, resetAll, resetValue, sameValue, setValue, useJig } from './store';
import type { Key, Values } from './store';
import type { ColorControl, JigValue, NumberControl, SelectControl, TextControl } from './types';

type SetActive = (active: boolean) => void;

export function JigPanel() {
  const values = useJig();
  const [open, setOpen] = useState(false);
  const [dockTop, setDockTop] = useState(false);
  const [sliding, setSliding] = useState(false);
  const [lock, setLock] = useState<{ message: string; status: string } | null>(null);
  const sheetWidth = Math.min(useWindowDimensions().width - 16, 420);
  const changedCount = keys.filter((k) => !sameValue(getControl(k), values[k], getControl(k).value)).length;

  const onLock = async () => {
    const { message, logLine, payload } = buildLock();
    console.log(logLine);
    const nothing = Object.keys(payload.changed).length === 0;
    let status = nothing
      ? 'Nothing changed. Paste this to remove the jig and keep the original values.'
      : 'Paste it into your agent chat. It is also printed in the Metro terminal as [jig:lock].';
    try {
      if (Platform.OS === 'web') {
        await webClipboard(message);
        status = 'Copied. ' + status;
      } else {
        await Share.share({ message });
      }
    } catch {
      status = 'Select the text below and copy it, or find [jig:lock] in the Metro terminal.';
    }
    setLock({ message, status });
  };

  return (
    <View style={s.overlay}>
      {!open && (
        <Pressable onPress={() => setOpen(true)} style={[s.fab, dockTop ? s.fabTop : s.fabBottom]}>
          <Text style={s.fabText}>{changedCount ? `Jig · ${changedCount}` : 'Jig'}</Text>
        </Pressable>
      )}
      {open && (
        <View style={[s.sheet, dockTop ? s.sheetTop : s.sheetBottom, { width: sheetWidth }]}>
          <View style={s.header}>
            <Text style={[s.text, s.title]}>Design jig</Text>
            <Text style={s.muted}>{changedCount ? `${changedCount} changed` : ''}</Text>
            <Btn label="⇅" onPress={() => setDockTop((d) => !d)} />
            <Btn label="×" onPress={() => setOpen(false)} />
          </View>
          <ScrollView style={s.body} scrollEnabled={!sliding} keyboardShouldPersistTaps="handled">
            {keys.length === 0 && <Text style={s.muted}>No controls yet. Add them in __jig__/controls.ts.</Text>}
            {groupKeys().map(([group, groupKeys]) => (
              <View key={group || '_'}>
                {group ? <Text style={s.group}>{group.toUpperCase()}</Text> : null}
                {groupKeys.map((k) => (
                  <Row key={k} k={k} values={values} onActive={setSliding} />
                ))}
              </View>
            ))}
          </ScrollView>
          {lock && (
            <View style={s.lockbox}>
              <Text style={s.text}>{lock.status}</Text>
              <ScrollView style={s.lockScroll}>
                <Text selectable style={[s.text, s.mono, s.small]}>
                  {lock.message}
                </Text>
              </ScrollView>
              <Btn label="Close" onPress={() => setLock(null)} />
            </View>
          )}
          <View style={s.footer}>
            <Btn label="Reset" onPress={() => resetAll()} disabled={!changedCount} />
            <Btn label="Lock" primary grow onPress={() => void onLock()} />
          </View>
        </View>
      )}
    </View>
  );
}

async function webClipboard(text: string) {
  const nav = (globalThis as { navigator?: { clipboard?: { writeText: (t: string) => Promise<void> } } }).navigator;
  if (!nav?.clipboard) throw new Error('Clipboard unavailable');
  await nav.clipboard.writeText(text);
}

function groupKeys(): [string, Key[]][] {
  const groups = new Map<string, Key[]>();
  for (const k of keys) {
    const group = getControl(k).group ?? '';
    groups.set(group, [...(groups.get(group) ?? []), k]);
  }
  return [...groups.entries()];
}

function Btn(props: { label: string; onPress: () => void; primary?: boolean; grow?: boolean; on?: boolean; disabled?: boolean }) {
  return (
    <Pressable
      onPress={props.onPress}
      disabled={props.disabled}
      style={[s.btn, props.primary && s.btnPrimary, props.on && s.btnOn, props.grow && s.grow, props.disabled && s.disabled]}
    >
      <Text style={[s.text, s.btnText, props.primary && s.bold]}>{props.label}</Text>
    </Pressable>
  );
}

function Row({ k, values, onActive }: { k: Key; values: Values; onActive: SetActive }) {
  const control = getControl(k);
  const value: JigValue = values[k];
  const changed = !sameValue(control, value, control.value);
  const onChange = (next: JigValue) => setValue(k, next);
  const otherKey = control.type === 'color' ? control.contrastWith : undefined;
  const other = otherKey && otherKey in values ? String(values[otherKey as Key]) : undefined;
  return (
    <View style={s.row}>
      <View style={s.line}>
        {changed && <View style={s.dot} />}
        <Text style={[s.text, s.grow]} numberOfLines={1}>
          {control.label ?? k}
        </Text>
        {changed && <Btn label="↺" onPress={() => resetValue(k)} />}
        {control.type === 'boolean' && <Switch value={Boolean(value)} onValueChange={onChange} />}
      </View>
      {control.type === 'color' && (
        <ColorField control={control} value={String(value)} other={other} onChange={onChange} onActive={onActive} />
      )}
      {control.type === 'number' && <NumberField control={control} value={Number(value)} onChange={onChange} onActive={onActive} />}
      {control.type === 'select' && <SelectField control={control} value={String(value)} onChange={onChange} />}
      {control.type === 'text' && <TextField control={control} value={String(value)} onChange={onChange} />}
    </View>
  );
}

/**
 * A PanResponder that reports positions relative to the touched view. Children must use pointerEvents: 'none'.
 * State lives in closure variables, and an effect hands it the latest callbacks.
 */
function createDrag() {
  let onMove: (x: number, y: number) => void = () => {};
  let onActive: SetActive | undefined;
  let startX = 0;
  let startY = 0;
  const end = () => onActive?.(false);
  const responder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (event: GestureResponderEvent) => {
      startX = event.nativeEvent.locationX;
      startY = event.nativeEvent.locationY;
      onActive?.(true);
      onMove(startX, startY);
    },
    onPanResponderMove: (_event: GestureResponderEvent, gesture: PanResponderGestureState) => {
      onMove(startX + gesture.dx, startY + gesture.dy);
    },
    onPanResponderRelease: end,
    onPanResponderTerminate: end,
  });
  return {
    handlers: responder.panHandlers,
    update(nextMove: (x: number, y: number) => void, nextActive?: SetActive) {
      onMove = nextMove;
      onActive = nextActive;
    },
  };
}

function useDrag(onMove: (x: number, y: number) => void, onActive?: SetActive) {
  const [drag] = useState(createDrag);
  useEffect(() => {
    drag.update(onMove, onActive);
  });
  return drag.handlers;
}

function snap(value: number, min: number, step: number): number {
  const decimals = (String(step).split('.')[1] ?? '').length;
  return Number((Math.round((value - min) / step) * step + min).toFixed(decimals));
}

function Slider(props: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  onActive?: SetActive;
  track?: string[];
}) {
  const { value, min, max, step, onChange, onActive, track } = props;
  const [width, setWidth] = useState(0);
  const handlers = useDrag((x) => {
    if (!width) return;
    const fraction = Math.min(1, Math.max(0, x / width));
    onChange(snap(min + fraction * (max - min), min, step));
  }, onActive);
  const fraction = max > min ? Math.min(1, Math.max(0, (value - min) / (max - min))) : 0;
  return (
    <View style={s.slider} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)} {...handlers}>
      <View style={[s.track, s.noTouch]}>
        {track ? (
          track.map((color, i) => <View key={i} style={[s.grow, { backgroundColor: color }]} />)
        ) : (
          <View style={[s.fill, { width: `${fraction * 100}%` }]} />
        )}
      </View>
      <View style={[s.thumb, s.noTouch, { left: fraction * width - 10 }]} />
    </View>
  );
}

const HUES = Array.from({ length: 25 }, (_, i) => hslToHex({ h: i * 15, s: 1, l: 0.5 }));
const RINGS = [
  { s: 0.25, n: 8 },
  { s: 0.5, n: 14 },
  { s: 0.75, n: 20 },
  { s: 1, n: 26 },
];
const WHEEL = 200;
const DOT = 16;

function DotWheel({ hsl, onChange, onActive }: { hsl: Hsl; onChange: (next: Hsl) => void; onActive: SetActive }) {
  const radius = WHEEL / 2 - DOT / 2;
  // Near white or black every hue looks the same, so the wheel shows (and picks at) a clamped lightness.
  const wheelL = Math.min(0.85, Math.max(0.15, hsl.l));
  const handlers = useDrag((x, y) => {
    const dx = x - WHEEL / 2;
    const dy = y - WHEEL / 2;
    const h = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
    onChange({ h, s: Math.min(1, Math.hypot(dx, dy) / radius), l: wheelL });
  }, onActive);
  const at = (h: number, sat: number) => {
    const a = (h * Math.PI) / 180;
    return { left: WHEEL / 2 + sat * radius * Math.sin(a), top: WHEEL / 2 - sat * radius * Math.cos(a) };
  };
  const dots = [{ h: 0, s: 0 }, ...RINGS.flatMap((ring) => Array.from({ length: ring.n }, (_, j) => ({ h: (j * 360) / ring.n, s: ring.s })))];
  const marker = at(hsl.h, hsl.s);
  return (
    <View style={s.wheel} {...handlers}>
      {dots.map((d, i) => {
        const p = at(d.h, d.s);
        return (
          <View
            key={i}
            style={[s.wheelDot, s.noTouch, { left: p.left - DOT / 2, top: p.top - DOT / 2, backgroundColor: hslToHex({ h: d.h, s: d.s, l: wheelL }) }]}
          />
        );
      })}
      <View style={[s.marker, s.noTouch, { left: marker.left - 10, top: marker.top - 10, backgroundColor: hslToHex(hsl) }]} />
    </View>
  );
}

function ColorField(props: { control: ColorControl; value: string; other?: string; onChange: (v: string) => void; onActive: SetActive }) {
  const { control, value, other, onChange, onActive } = props;
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
  const steps = (make: (t: number) => Hsl) => Array.from({ length: 12 }, (_, i) => hslToHex(make(i / 11)));
  return (
    <View style={s.gap}>
      <View style={s.line}>
        <Pressable onPress={() => setOpen((o) => !o)} style={[s.swatchBig, { backgroundColor: hex }]} />
        <TextInput
          value={draft ?? hex}
          onChangeText={setDraft}
          onBlur={commit}
          onSubmitEditing={commit}
          autoCapitalize="none"
          autoCorrect={false}
          style={[s.input, s.mono, s.grow]}
        />
        <Btn label="◎" on={open} onPress={() => setOpen((o) => !o)} />
      </View>
      {open && (
        <View style={s.gap}>
          <DotWheel hsl={hsl} onChange={setHsl} onActive={onActive} />
          <LabeledSlider label="H" text={`${Math.round(hsl.h)}°`}>
            <Slider value={hsl.h} min={0} max={360} step={1} track={HUES} onActive={onActive} onChange={(h) => setHsl({ ...hsl, h })} />
          </LabeledSlider>
          <LabeledSlider label="S" text={`${Math.round(hsl.s * 100)}%`}>
            <Slider value={hsl.s} min={0} max={1} step={0.01} track={steps((t) => ({ ...hsl, s: t }))} onActive={onActive} onChange={(v) => setHsl({ ...hsl, s: v })} />
          </LabeledSlider>
          <LabeledSlider label="L" text={`${Math.round(hsl.l * 100)}%`}>
            <Slider value={hsl.l} min={0} max={1} step={0.01} track={steps((t) => ({ ...hsl, l: t }))} onActive={onActive} onChange={(v) => setHsl({ ...hsl, l: v })} />
          </LabeledSlider>
        </View>
      )}
      {control.presets && control.presets.length > 0 && (
        <View style={s.swatches}>
          {control.presets.map((preset) => {
            const presetHex = normalizeHex(preset);
            return (
              <Pressable
                key={preset}
                onPress={() => {
                  if (presetHex) {
                    setMemo(null);
                    onChange(presetHex);
                  }
                }}
                style={[s.swatch, { backgroundColor: presetHex ?? preset }, presetHex === hex && s.swatchOn]}
              />
            );
          })}
        </View>
      )}
      {ratio !== null && other && <Contrast ratio={ratio} bg={hex} fg={other} />}
    </View>
  );
}

function LabeledSlider({ label, text, children }: { label: string; text: string; children: ReactNode }) {
  return (
    <View style={s.line}>
      <Text style={[s.muted, s.sliderLabel]}>{label}</Text>
      <View style={s.grow}>{children}</View>
      <Text style={[s.text, s.mono, s.num]}>{text}</Text>
    </View>
  );
}

function Contrast({ ratio, bg, fg }: { ratio: number; bg: string; fg: string }) {
  const label = contrastLabel(ratio);
  const color = label === 'Fail' ? '#f87171' : label === 'AA large' ? '#fbbf24' : '#4ade80';
  return (
    <View style={s.line}>
      <View style={[s.chip, { backgroundColor: bg }]}>
        <Text style={[s.bold, { color: normalizeHex(fg) ? fg : readableOn(bg) }]}>Aa</Text>
      </View>
      <Text style={[s.text, s.mono]}>{ratio.toFixed(2)}:1</Text>
      <Text style={[s.badge, { color, borderColor: color }]}>{label}</Text>
    </View>
  );
}

function NumberField(props: { control: NumberControl; value: number; onChange: (v: number) => void; onActive: SetActive }) {
  const { control, value, onChange, onActive } = props;
  const span = control.max - control.min;
  const step = control.step ?? (span >= 20 ? 1 : span >= 2 ? 0.1 : 0.01);
  const nudge = (direction: 1 | -1) => onChange(snap(value + direction * step, control.min, step));
  return (
    <View style={s.line}>
      <View style={s.grow}>
        <Slider value={value} min={control.min} max={control.max} step={step} onChange={onChange} onActive={onActive} />
      </View>
      <Btn label="−" onPress={() => nudge(-1)} />
      <Text style={[s.text, s.mono, s.num]}>
        {value}
        {control.unit ?? ''}
      </Text>
      <Btn label="+" onPress={() => nudge(1)} />
    </View>
  );
}

function SelectField({ control, value, onChange }: { control: SelectControl; value: string; onChange: (v: string) => void }) {
  return (
    <View style={s.seg}>
      {control.options.map((option) => (
        <Btn key={option} label={option} on={option === value} onPress={() => onChange(option)} />
      ))}
    </View>
  );
}

function TextField({ control, value, onChange }: { control: TextControl; value: string; onChange: (v: string) => void }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      multiline={control.multiline}
      autoCorrect={false}
      style={[s.input, control.multiline && s.multiline]}
    />
  );
}

const mono = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

const s = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 9999, elevation: 9999, pointerEvents: 'box-none' },
  fab: {
    position: 'absolute',
    right: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(24,24,27,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  fabBottom: { bottom: Platform.OS === 'ios' ? 96 : 72 },
  fabTop: { top: Platform.OS === 'ios' ? 60 : 32 },
  fabText: { color: '#fafafa', fontWeight: '600', fontSize: 13 },
  sheet: {
    position: 'absolute',
    right: 8,
    maxHeight: '62%',
    borderRadius: 14,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  sheetBottom: { bottom: Platform.OS === 'ios' ? 34 : 12 },
  sheetTop: { top: Platform.OS === 'ios' ? 54 : 28 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.15)',
  },
  title: { flex: 1, fontWeight: '600' },
  body: { paddingHorizontal: 12 },
  group: { marginTop: 12, fontSize: 10, letterSpacing: 0.6, color: '#71717a' },
  row: { paddingVertical: 10, gap: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.08)' },
  line: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  gap: { gap: 8 },
  grow: { flex: 1 },
  text: { color: '#e4e4e7', fontSize: 13 },
  muted: { color: '#a1a1aa', fontSize: 12 },
  bold: { fontWeight: '700' },
  mono: { fontFamily: mono },
  small: { fontSize: 11 },
  num: { minWidth: 48, textAlign: 'right' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#60a5fa' },
  btn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  btnOn: { backgroundColor: 'rgba(255,255,255,0.22)' },
  btnPrimary: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  btnText: { color: '#fafafa' },
  disabled: { opacity: 0.4 },
  input: {
    color: '#e4e4e7',
    fontSize: 13,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  multiline: { minHeight: 64, textAlignVertical: 'top' },
  noTouch: { pointerEvents: 'none' },
  slider: { height: 32, justifyContent: 'center' },
  track: { height: 8, borderRadius: 4, overflow: 'hidden', flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)' },
  fill: { backgroundColor: '#60a5fa' },
  thumb: {
    position: 'absolute',
    top: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.3)',
  },
  sliderLabel: { width: 14 },
  wheel: { width: WHEEL, height: WHEEL, alignSelf: 'center' },
  wheelDot: { position: 'absolute', width: DOT, height: DOT, borderRadius: DOT / 2 },
  marker: { position: 'absolute', width: 20, height: 20, borderRadius: 10, borderWidth: 3, borderColor: '#ffffff' },
  swatchBig: { width: 32, height: 32, borderRadius: 7, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  swatch: { width: 24, height: 24, borderRadius: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  swatchOn: { borderWidth: 2, borderColor: '#ffffff' },
  chip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5 },
  badge: { fontSize: 11, paddingHorizontal: 5, borderWidth: 1, borderRadius: 4, overflow: 'hidden' },
  seg: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  lockbox: { padding: 12, gap: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.15)' },
  lockScroll: { maxHeight: 140 },
  footer: {
    flexDirection: 'row',
    gap: 6,
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
});
