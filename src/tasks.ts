import type { State } from './state';

export interface Task {
  /** number shown in the banner (omitted when a view should not be numbered) */
  n?: number;
  /** optional bold lead-in */
  title?: string;
  detail: string;
  /** optional second line */
  description?: string;
}

/**
 * Switch for the orange task strip on top of the app. Set to `true` to turn it back on
 * (the numbering/derivation logic below keeps working while it is off).
 */
export const SHOW_TASK_BANNER = false;

/**
 * Placeholder copy only. Real task texts get written later; keep ALL copy in this one place.
 * The numbering logic below is final: it is derived from the state and only ever goes up.
 */
const COPY = {
  detail: 'Task detail',
  description: 'Task short description',
};

const t = (n: number): Task => ({ n, detail: COPY.detail, description: COPY.description });

/**
 * Banner step for the view the tester is looking at.
 *   1  Audits (Count / Removal tasks)
 *   2  "Do you want to start this task?" sheet
 *   3+ SKU list / scan modal: 3 + every count or out-of-stock action done so far (recounts included),
 *      so it never repeats and never skips, whichever card the tester picks
 *   +1 "Send" sheet and the sending spinner
 *   +2 summary
 */
export function stepFor(s: State): number {
  const list = 3 + s.events;
  if (s.screen === 'audits' || s.screen === 'language') return s.sheet === 'start' ? 2 : 1;
  if (s.screen === 'summary') return list + 2;
  if (s.sheet === 'send' || s.sending) return list + 1;
  return list;
}

/** The task the tester should be doing on the view they are looking at. */
export function taskFor(s: State): Task {
  return t(stepFor(s));
}
