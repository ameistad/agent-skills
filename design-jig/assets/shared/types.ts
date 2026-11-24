// design-jig: control types. Temporary file, deleted when the jig is locked or discarded.

type Base = {
  /** Label shown in the panel. Defaults to the control key. */
  label?: string;
  /** Panel section heading. Controls with the same group are shown together. */
  group?: string;
  /** Where the value is applied, for example "src/components/Hero.tsx". Included in the lock payload. */
  file?: string;
};

export type ColorControl = Base & {
  type: 'color';
  /** The ORIGINAL value in the code, as hex (#rgb, #rrggbb or #rrggbbaa). */
  value: string;
  /** Swatches to offer, ideally the project's own palette or tokens. */
  presets?: readonly string[];
  /** Key of another color control. The panel shows the WCAG contrast ratio between the two. */
  contrastWith?: string;
};

export type NumberControl = Base & {
  type: 'number';
  /** The ORIGINAL value in the code. */
  value: number;
  min: number;
  max: number;
  step?: number;
  /** Appended to the CSS variable, for example "px", "rem", "ms". */
  unit?: string;
};

export type BooleanControl = Base & {
  type: 'boolean';
  /** The ORIGINAL value in the code. */
  value: boolean;
};

export type SelectControl = Base & {
  type: 'select';
  /** The ORIGINAL option. Must be one of `options`. */
  value: string;
  options: readonly string[];
};

export type TextControl = Base & {
  type: 'text';
  /** The ORIGINAL value in the code. */
  value: string;
  multiline?: boolean;
};

export type Control = ColorControl | NumberControl | BooleanControl | SelectControl | TextControl;

export type Controls = Record<string, Control>;

export type JigValue = string | number | boolean;

export type JigValues<T extends Controls> = { [K in keyof T]: T[K]['value'] };

/** Identity helper that keeps literal control types for `useJig()` inference. */
export function defineControls<T extends Controls>(controls: T): T {
  return controls;
}
