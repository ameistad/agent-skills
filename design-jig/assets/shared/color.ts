// design-jig: color helpers. Temporary file, deleted when the jig is locked or discarded.

export type Hsl = { h: number; s: number; l: number };

/** Returns lowercase #rrggbb or #rrggbbaa, or null if the input is not a hex color. */
export function normalizeHex(input: string): string | null {
  let hex = input.trim().replace(/^#/, '').toLowerCase();
  if (!/^([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(hex)) return null;
  if (hex.length <= 4) hex = hex.split('').map((c) => c + c).join('');
  return '#' + hex;
}

/** Splits a normalized hex into its rgb part and alpha suffix ("" when opaque). */
function splitAlpha(hex: string): [string, string] {
  return hex.length === 9 ? [hex.slice(0, 7), hex.slice(7)] : [hex, ''];
}

function hexToRgb(hex: string): [number, number, number] {
  const [rgb] = splitAlpha(normalizeHex(hex) ?? '#000000');
  return [1, 3, 5].map((i) => parseInt(rgb.slice(i, i + 2), 16)) as [number, number, number];
}

export function hexToHsl(hex: string): Hsl {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return { h: h * 60, s, l };
}

/** h in degrees, s and l in 0..1. Keeps the alpha suffix of `keepAlphaFrom` if given. */
export function hslToHex({ h, s, l }: Hsl, keepAlphaFrom?: string): string {
  const hue = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  let rgb: [number, number, number];
  if (hue < 60) rgb = [c, x, 0];
  else if (hue < 120) rgb = [x, c, 0];
  else if (hue < 180) rgb = [0, c, x];
  else if (hue < 240) rgb = [0, x, c];
  else if (hue < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  const hex = '#' + rgb.map((v) => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('');
  const alpha = keepAlphaFrom ? splitAlpha(normalizeHex(keepAlphaFrom) ?? '')[1] : '';
  return hex + alpha;
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2 contrast ratio between two hex colors (alpha ignored), or null if either is invalid. */
export function contrastRatio(a: string, b: string): number | null {
  if (!normalizeHex(a) || !normalizeHex(b)) return null;
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function contrastLabel(ratio: number): 'AAA' | 'AA' | 'AA large' | 'Fail' {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA large';
  return 'Fail';
}

/** Black or white, whichever reads better on the given background. */
export function readableOn(hex: string): string {
  return luminance(hex) > 0.4 ? '#000000' : '#ffffff';
}
