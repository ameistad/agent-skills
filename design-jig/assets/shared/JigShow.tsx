'use client';
// design-jig: renders children only when a boolean or select control matches. Temporary file, deleted when the jig
// is locked or discarded. Works inside Next.js server components: the children stay server-rendered.
//   <JigShow when="showBadge">...</JigShow>              boolean control is on
//   <JigShow when="heroLayout" is="split">...</JigShow>  select control equals "split"
//   <JigText k="ctaLabel" />                             renders a text or number control's value
import type { ReactNode } from 'react';
import { useJig } from './store';
import type { Key } from './store';
import type { JigValue } from './types';

export function JigShow({ when, is, children }: { when: Key; is?: JigValue; children: ReactNode }) {
  const value = useJig()[when];
  const visible = is === undefined ? Boolean(value) : value === is;
  return visible ? <>{children}</> : null;
}

export function JigText({ k }: { k: Key }) {
  return <>{String(useJig()[k])}</>;
}
