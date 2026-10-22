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
 *   1  task list
 *   2  "Assign to me?" sheet
 *   3+ SKU list / scan modal: 3 + every count or out-of-stock action done so far (recounts included),
 *      so it never repeats and never skips, whichever card the tester picks
 *   +1 "Send" sheet and the sending spinner
 *   +2 summary
 */
export function stepFor(s: State): number {
  const list = 3 + s.events;
  if (s.screen === 'tasks') return s.sheet === 'assign' ? 2 : 1;
  if (s.screen === 'summary') return list + 2;
  if (s.sheet === 'send' || s.sending) return list + 1;
  return list;
}

/** The task the tester should be doing on the view they are looking at. */
export function taskFor(s: State): Task {
  return t(stepFor(s));
}
