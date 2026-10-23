import { LOC_BY_ID, LOC_ORDER, PRODUCTS, batchTotal, defaultBatches, fmtDate, productLocs } from './data';
import type { Batch, LocId, ProductId } from './data';

export type Tab = 'todo' | 'done';
export type Screen = 'audits' | 'skus' | 'summary';
export type AuditsTab = 'count' | 'removal';
export type Pill = 'counting' | 'recount' | null;

export interface LocState {
  done: boolean;
  count: number;
  oos: boolean;
  /** processing order, newest = highest (drives the Processed tab order) */
  seq: number;
  /** expiry-date batches counted at this location (kept, zeroed, when the product goes back to recount) */
  batches: Batch[];
}

export type PdpSheet =
  | null
  | { kind: 'qty'; date: string; isNew: boolean; value: string }
  | { kind: 'calendar'; viewY: number; viewM: number; y: number; m: number; d: number };

/** Product detail page of a location: one card per expiry date. */
export interface Pdp {
  loc: LocId;
  batches: Batch[];
  /** Stock Discrepancy banner (a recount that starts on this very location) */
  banner: boolean;
  sheet: PdpSheet;
}

export interface Alert {
  id: number;
  text: string;
}

export interface State {
  screen: Screen;
  auditsTab: AuditsTab;
  /** task the tester picked on the Audits list */
  taskId: string;
  sheet: null | 'start' | 'send';
  sending: boolean;
  tab: Tab;
  locs: Record<LocId, LocState>;
  /** products currently in recount mode */
  recount: Record<ProductId, boolean>;
  /** location the recount starts with (shown first in the list) */
  recountFirst: Partial<Record<ProductId, LocId>>;
  /** discrepancy banner on the product list */
  banner: boolean;
  /** how many products ever triggered a discrepancy (red chip on the summary) */
  discrepancies: number;
  pdp: Pdp | null;
  /** "How to check Expiry Dates" hint closed */
  hintClosed: boolean;
  detail: ProductId | null;
  /** location whose card is slid open to reveal "Out of Stock" */
  swipe: LocId | null;
  alert: Alert | null;
  /** monotonic counters */
  events: number;
  seq: number;
  alertId: number;
}

const emptyLoc = (): LocState => ({ done: false, count: 0, oos: false, seq: 0, batches: defaultBatches() });
const zeroed = (b: Batch[]): Batch[] => b.map((x) => ({ ...x, qty: 0 }));

export const initialState: State = {
  screen: 'audits',
  auditsTab: 'count',
  taskId: '67890',
  sheet: null,
  sending: false,
  tab: 'todo',
  locs: Object.fromEntries(LOC_ORDER.map((id) => [id, emptyLoc()])) as Record<LocId, LocState>,
  recount: { sita: false, burine: false },
  recountFirst: {},
  banner: false,
  discrepancies: 0,
  pdp: null,
  hintClosed: false,
  detail: null,
  swipe: null,
  alert: null,
  events: 0,
  seq: 0,
  alertId: 0,
};

export type Action =
  | { type: 'auditsTab'; tab: AuditsTab }
  | { type: 'openTicket'; id: string }
  | { type: 'closeSheet' }
  | { type: 'start' }
  | { type: 'back' }
  | { type: 'tab'; tab: Tab }
  | { type: 'scan'; loc: LocId }
  | { type: 'pdpBack' }
  | { type: 'closeHint' }
  | { type: 'openQty'; date: string }
  | { type: 'qtyType'; value: string }
  | { type: 'qtyDone' }
  | { type: 'openCalendar' }
  | { type: 'calSelect'; y: number; m: number; d: number }
  | { type: 'calMonth'; delta: number }
  | { type: 'calApply' }
  | { type: 'sheetCancel' }
  | { type: 'confirm' }
  | { type: 'swipe'; loc: LocId | null }
  | { type: 'oos'; loc: LocId }
  | { type: 'detail'; product: ProductId | null }
  | { type: 'complete' }
  | { type: 'send' }
  | { type: 'sent' }
  | { type: 'reset' }
  | { type: 'alert'; text: string | null }
  | { type: 'jump'; preset: string };

export const ALERTS = {
  network: 'We could not retrieve product information. Please check your internet connection and try again.',
  wrong: 'The Product you scanned is not in the list. Please try again.',
  error: 'An error occurred. Please try again.',
};

/* ---------- selectors ---------- */

export const pendingLocs = (s: State): LocId[] => {
  const base = LOC_ORDER.filter((id) => !s.locs[id].done);
  const rank = (id: LocId) => {
    const p = LOC_BY_ID[id].product;
    if (!s.recount[p]) return 1000 + LOC_ORDER.indexOf(id);
    // products in recount come first; the location the recount starts with leads
    const first = s.recountFirst[p] === id ? -1 : 0;
    return first + LOC_ORDER.indexOf(id) / 100;
  };
  return base.sort((a, b) => rank(a) - rank(b));
};

export const doneLocs = (s: State): LocId[] =>
  LOC_ORDER.filter((id) => s.locs[id].done).sort((a, b) => s.locs[b].seq - s.locs[a].seq);

export const pillFor = (s: State, id: LocId): Pill => {
  const p = LOC_BY_ID[id].product;
  const all = productLocs(p);
  const done = all.filter((l) => s.locs[l].done).length;
  if (s.recount[p] && done < all.length) return 'recount';
  if (!s.recount[p] && done > 0 && done < all.length) return 'counting';
  return null;
};

export const allDone = (s: State) => LOC_ORDER.every((id) => s.locs[id].done);

const productComplete = (s: State, p: ProductId) => productLocs(p).every((l) => s.locs[l].done);
const productTotal = (s: State, p: ProductId) => productLocs(p).reduce((n, l) => n + s.locs[l].count, 0);

/* ---------- reducer ---------- */

/**
 * A location was just counted (or marked out of stock). If it completed a product for the first time and the
 * units don't match what the system expects, the whole product goes back to recount. `viaPdp` keeps the
 * product page open on the location that triggered it ("starting with this one").
 */
function afterCount(s: State, loc: LocId, viaPdp: boolean): State {
  const p = LOC_BY_ID[loc].product;
  if (s.recount[p]) {
    // recount finished for this product → pills disappear, discrepancy resolved
    if (productComplete(s, p)) return { ...s, recount: { ...s.recount, [p]: false }, banner: false, tab: 'done' };
    return { ...s, banner: false, tab: 'done' };
  }
  if (productComplete(s, p) && productTotal(s, p) !== PRODUCTS[p].expected) {
    const locs = { ...s.locs };
    for (const l of productLocs(p)) locs[l] = { ...emptyLoc(), batches: zeroed(s.locs[l].batches) };
    return {
      ...s,
      locs,
      recount: { ...s.recount, [p]: true },
      recountFirst: { ...s.recountFirst, [p]: loc },
      discrepancies: s.discrepancies + 1,
      banner: !viaPdp,
      tab: 'todo',
      pdp: viaPdp ? { loc, batches: locs[loc].batches, banner: true, sheet: null } : null,
    };
  }
  return { ...s, tab: 'done' };
}

const withSheet = (s: State, sheet: PdpSheet): State => (s.pdp ? { ...s, pdp: { ...s.pdp, sheet } } : s);

export function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'auditsTab':
      return { ...s, auditsTab: a.tab };
    case 'openTicket':
      return { ...s, taskId: a.id, sheet: 'start' };
    case 'closeSheet':
      return { ...s, sheet: null };
    case 'start':
      return { ...s, sheet: null, screen: 'skus', tab: 'todo' };
    case 'back':
      return { ...s, screen: 'audits', sheet: null, pdp: null, detail: null, swipe: null, alert: null };
    case 'tab':
      return { ...s, tab: a.tab, swipe: null };
    case 'scan':
      return { ...s, pdp: { loc: a.loc, batches: s.locs[a.loc].batches.map((b) => ({ ...b })), banner: false, sheet: null }, swipe: null, alert: null };
    case 'pdpBack':
      return { ...s, pdp: null };
    case 'closeHint':
      return { ...s, hintClosed: true };
    case 'openQty': {
      if (!s.pdp) return s;
      const cur = s.pdp.batches.find((b) => b.date === a.date);
      return withSheet(s, { kind: 'qty', date: a.date, isNew: false, value: cur && cur.qty ? String(cur.qty) : '' });
    }
    case 'qtyType': {
      const sh = s.pdp?.sheet;
      if (!sh || sh.kind !== 'qty') return s;
      return withSheet(s, { ...sh, value: a.value.replace(/\D/g, '').slice(0, 5) });
    }
    case 'qtyDone': {
      const sh = s.pdp?.sheet;
      if (!s.pdp || !sh || sh.kind !== 'qty') return s;
      const qty = sh.value ? parseInt(sh.value, 10) : 0;
      const exists = s.pdp.batches.some((b) => b.date === sh.date);
      const batches = exists ? s.pdp.batches.map((b) => (b.date === sh.date ? { ...b, qty } : b)) : [...s.pdp.batches, { date: sh.date, qty }];
      return { ...s, pdp: { ...s.pdp, batches, banner: false, sheet: null } };
    }
    case 'openCalendar':
      return withSheet(s, { kind: 'calendar', viewY: 2026, viewM: 7, y: 2026, m: 7, d: 17 });
    case 'calSelect': {
      const sh = s.pdp?.sheet;
      if (!sh || sh.kind !== 'calendar') return s;
      return withSheet(s, { ...sh, y: a.y, m: a.m, d: a.d });
    }
    case 'calMonth': {
      const sh = s.pdp?.sheet;
      if (!sh || sh.kind !== 'calendar') return s;
      const t = sh.viewY * 12 + sh.viewM + a.delta;
      return withSheet(s, { ...sh, viewY: Math.floor(t / 12), viewM: ((t % 12) + 12) % 12 });
    }
    case 'calApply': {
      const sh = s.pdp?.sheet;
      if (!sh || sh.kind !== 'calendar') return s;
      const date = fmtDate(sh.y, sh.m, sh.d);
      const cur = s.pdp!.batches.find((b) => b.date === date);
      return withSheet(s, { kind: 'qty', date, isNew: !cur, value: cur && cur.qty ? String(cur.qty) : '' });
    }
    case 'sheetCancel':
      return withSheet(s, null);
    case 'confirm': {
      if (!s.pdp || s.pdp.sheet || batchTotal(s.pdp.batches) === 0) return s;
      const { loc, batches } = s.pdp;
      const seq = s.seq + 1;
      const next: State = {
        ...s,
        pdp: null,
        events: s.events + 1,
        seq,
        locs: { ...s.locs, [loc]: { done: true, count: batchTotal(batches), oos: false, seq, batches } },
      };
      return afterCount(next, loc, true);
    }
    case 'swipe':
      return { ...s, swipe: a.loc };
    case 'oos': {
      const seq = s.seq + 1;
      const next: State = {
        ...s,
        swipe: null,
        events: s.events + 1,
        seq,
        locs: { ...s.locs, [a.loc]: { done: true, count: 0, oos: true, seq, batches: zeroed(s.locs[a.loc].batches) } },
      };
      return afterCount(next, a.loc, false);
    }
    case 'detail':
      return { ...s, detail: a.product };
    case 'complete':
      return { ...s, sheet: 'send', alert: null };
    case 'send':
      return { ...s, sending: true, sheet: null };
    case 'sent':
      return { ...s, sending: false, screen: 'summary' };
    case 'reset':
      return { ...initialState, alertId: s.alertId };
    case 'alert':
      return a.text ? { ...s, alert: { id: s.alertId + 1, text: a.text }, alertId: s.alertId + 1 } : { ...s, alert: null };
    case 'jump': {
      const p = PRESETS.find((x) => x.id === a.preset);
      if (!p) return s;
      return p.actions.reduce(reducer, { ...initialState, alertId: s.alertId });
    }
  }
}

/* ---------- navigator presets (pure replays of the real flow) ---------- */

export interface Preset {
  id: string;
  /** view letter + use-case number, e.g. B3 */
  code: string;
  group: string;
  label: string;
  actions: Action[];
}

const D1 = '12.12.2027';
const D2 = '21.11.2027';
const START: Action[] = [{ type: 'openTicket', id: '67890' }, { type: 'start' }];
const scan = (loc: LocId): Action[] => [{ type: 'scan', loc }];
const qty = (date: string, v: string): Action[] => [{ type: 'openQty', date }, { type: 'qtyType', value: v }, { type: 'qtyDone' }];
const filled = (loc: LocId, a: string, b: string): Action[] => [...scan(loc), ...qty(D1, a), ...qty(D2, b)];
const fill = (loc: LocId, a: string, b: string): Action[] => [...filled(loc, a, b), { type: 'confirm' }];
const oos = (loc: LocId): Action[] => [{ type: 'swipe', loc }, { type: 'oos', loc }];
const todo: Action = { type: 'tab', tab: 'todo' };
const newBatch: Action[] = [{ type: 'openCalendar' }, { type: 'calApply' }];

// Reaching a given point of the flow, as the tester would (Sita expects 10 units, Burine 30)
const S1: Action[] = [...START, ...fill('sita1', '4', '2'), todo];
const S2: Action[] = [...S1, ...fill('sita2', '3', '1'), todo];
const ALL: Action[] = [...S2, ...fill('burine', '20', '10')];
// Out of Stock on the last SKU → discrepancy banner on the list, recount
const RC1: Action[] = [...S2, ...oos('burine')];
// Wrong total typed on the last SKU → discrepancy shown on the product page itself
const DM: Action[] = [...S2, ...filled('burine', '15', '10'), { type: 'confirm' }];

const CODES: Record<string, string> = {
  'audits': 'A1', 'removal': 'A2', 'start': 'B1',
  'skus': 'C1', 'sita2-todo': 'C2', 'burine-todo': 'C3', 'burine-swipe': 'C4', 'burine-banner': 'C5', 'burine-swipe2': 'C6', 'alert-network': 'C7', 'alert-wrong': 'C8',
  'processed-1': 'D1', 'processed-2': 'D2', 'processed-oos': 'D3', 'processed-recount': 'D4', 'all-done': 'D5', 'alert-complete': 'D6',
  'pdp-initial': 'E1', 'pdp-hint-closed': 'E2', 'pdp-entered': 'E3', 'pdp-new-batch': 'E4', 'pdp-recount': 'E5', 'pdp-discrepancy': 'E6',
  'qty-empty': 'F1', 'qty-entered': 'F2', 'qty-new-empty': 'F3', 'qty-new-entered': 'F4',
  'calendar': 'G1', 'detail': 'H1', 'send': 'I1', 'alert-send': 'I2', 'loading': 'J1', 'summary': 'K1',
};
const TITLES: Record<string, string> = {
  A: 'Audits', B: 'Start task sheet', C: 'SKU list · To be processed', D: 'SKU list · Checked', E: 'Product page · expiry batches',
  F: 'Quantity sheet', G: 'Expiry date calendar', H: 'Product image', I: 'Send sheet', J: 'Sending', K: 'Summary',
};
const P = (id: string, label: string, actions: Action[]): Preset => {
  const code = CODES[id];
  return { id, code, group: `${code[0]} · ${TITLES[code[0]]}`, label, actions };
};

const RAW: Preset[] = [
  P('audits', 'Count Tasks · Cycle Count', []),
  P('removal', 'Removal Tasks', [{ type: 'auditsTab', tab: 'removal' }]),
  P('start', 'Do you want to start this task?', [{ type: 'openTicket', id: '67890' }]),

  P('skus', 'Nothing counted', START),
  P('sita2-todo', 'Sita 2 on top (Counting)', S1),
  P('burine-todo', 'Burine only (single location)', S2),
  P('burine-swipe', 'Burine swiped (Out of Stock)', [...S2, { type: 'swipe', loc: 'burine' }]),
  P('burine-banner', 'Stock Discrepancy · banner on list', RC1),
  P('burine-swipe2', 'Recount · Burine swiped again', [...RC1, { type: 'swipe', loc: 'burine' }]),
  P('alert-network', 'Scan failed · no connection', [...START, { type: 'alert', text: ALERTS.network }]),
  P('alert-wrong', 'Wrong product scanned', [...S1, { type: 'alert', text: ALERTS.wrong }]),

  P('processed-1', 'Checked · 1 item', S1.slice(0, -1)),
  P('processed-2', 'Checked · 2 items', S2.slice(0, -1)),
  P('processed-oos', 'Checked · Burine recount out of stock (00)', [...RC1, ...oos('burine')]),
  P('processed-recount', 'Checked · all, after a real recount', [...RC1, ...fill('burine', '20', '10')]),
  P('all-done', 'Checked · all, Complete enabled', ALL),
  P('alert-complete', 'Complete failed · connection', [...ALL, { type: 'alert', text: ALERTS.error }]),

  P('pdp-initial', 'Sita 1 · first open (hint, 0 / 0)', [...START, ...scan('sita1')]),
  P('pdp-hint-closed', 'Sita 1 · hint closed', [...START, ...scan('sita1'), { type: 'closeHint' }]),
  P('pdp-entered', 'Sita 1 · quantities entered', [...START, ...filled('sita1', '4', '2'), { type: 'closeHint' }]),
  P('pdp-new-batch', 'Sita 1 · new batch added', [...START, ...scan('sita1'), { type: 'closeHint' }, ...qty(D1, '4'), ...qty(D2, '2'), ...newBatch, { type: 'qtyType', value: '3' }, { type: 'qtyDone' }]),
  P('pdp-recount', 'Burine · recount (Recount tag, 0 / 0)', [...RC1, ...scan('burine'), { type: 'closeHint' }]),
  P('pdp-discrepancy', 'Stock Discrepancy · on the product page', DM),

  P('qty-empty', 'Quantity sheet · empty', [...START, ...scan('sita1'), { type: 'closeHint' }, { type: 'openQty', date: D1 }]),
  P('qty-entered', 'Quantity sheet · value typed', [...START, ...scan('sita1'), { type: 'closeHint' }, { type: 'openQty', date: D1 }, { type: 'qtyType', value: '4' }]),
  P('qty-new-empty', 'Quantity sheet · new batch, empty', [...START, ...scan('sita1'), { type: 'closeHint' }, ...newBatch]),
  P('qty-new-entered', 'Quantity sheet · new batch, value typed', [...START, ...scan('sita1'), { type: 'closeHint' }, ...newBatch, { type: 'qtyType', value: '3' }]),

  P('calendar', 'Which expiry date you want to capture?', [...START, ...scan('sita1'), { type: 'closeHint' }, { type: 'openCalendar' }]),
  P('detail', 'Product image tapped', [...START, { type: 'detail', product: 'sita' }]),

  P('send', 'Send inventory count', [...ALL, { type: 'complete' }]),
  P('alert-send', 'Send failed · connection', [...ALL, { type: 'complete' }, { type: 'alert', text: ALERTS.error }]),
  P('loading', 'Sending…', [...ALL, { type: 'complete' }, { type: 'send' }]),
  P('summary', 'Task completed · summary', [...ALL, { type: 'complete' }, { type: 'send' }, { type: 'sent' }]),
];

const codeKey = (c: string) => c.charCodeAt(0) * 100 + parseInt(c.slice(1), 10);
export const PRESETS: Preset[] = [...RAW].sort((a, b) => codeKey(a.code) - codeKey(b.code));

/**
 * View code (letter + use case) of the state the tester is looking at, derived from the state itself so it
 * never drops out during free play. Keep in sync with CODES above.
 */
export function codeFor(s: State): string {
  if (s.screen === 'summary') return 'K1';
  if (s.sending) return 'J1';
  if (s.sheet === 'send') return s.alert ? 'I2' : 'I1';
  if (s.detail) return 'H1';
  if (s.screen === 'audits') return s.sheet === 'start' ? 'B1' : s.auditsTab === 'removal' ? 'A2' : 'A1';
  if (s.pdp) {
    const { sheet, batches, banner, loc } = s.pdp;
    if (sheet?.kind === 'calendar') return 'G1';
    if (sheet?.kind === 'qty') return sheet.isNew ? (sheet.value ? 'F4' : 'F3') : sheet.value ? 'F2' : 'F1';
    if (banner) return 'E6';
    if (s.recount[LOC_BY_ID[loc].product]) return 'E5';
    if (batches.length > 2) return 'E4';
    if (batchTotal(batches) > 0) return 'E3';
    return s.hintClosed ? 'E2' : 'E1';
  }
  const done = LOC_ORDER.filter((id) => s.locs[id].done);
  if (s.tab === 'done') {
    if (s.alert) return 'D6';
    if (s.locs.burine.oos) return 'D3';
    if (allDone(s)) return s.discrepancies > 0 ? 'D4' : 'D5';
    return done.length >= 2 ? 'D2' : 'D1';
  }
  if (s.alert) return s.alert.text === ALERTS.network ? 'C7' : 'C8';
  if (s.swipe) return s.recount.burine ? 'C6' : 'C4';
  if (s.banner) return 'C5';
  if (allDone(s)) return 'D5';
  return done.length === 0 ? 'C1' : done.length === 1 ? 'C2' : 'C3';
}
