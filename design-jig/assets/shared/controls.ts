// design-jig: the controls for this session. Temporary file, deleted when the jig is locked or discarded.
//
// One entry per value the user wants to explore. `value` is always the ORIGINAL value in the code,
// so Reset, Discard and the lock payload's "unchanged" list stay exact.
//
// Examples (delete them and add real controls):
//   heroBg:     { type: 'color', value: '#0f172a', label: 'Hero background', group: 'Hero', file: 'src/components/Hero.tsx', contrastWith: 'heroText' },
//   heroText:   { type: 'color', value: '#f8fafc', label: 'Hero text', group: 'Hero', file: 'src/components/Hero.tsx' },
//   cardRadius: { type: 'number', value: 12, min: 0, max: 32, step: 1, unit: 'px', group: 'Card', file: 'src/components/Card.tsx' },
//   showBadge:  { type: 'boolean', value: true, group: 'Card', file: 'src/components/Card.tsx' },
//   heroLayout: { type: 'select', value: 'stacked', options: ['stacked', 'split', 'centered'], group: 'Hero', file: 'src/components/Hero.tsx' },
//   ctaLabel:   { type: 'text', value: 'Get started', group: 'Hero', file: 'src/components/Hero.tsx' },
import { defineControls } from './types';

export const controls = defineControls({});
