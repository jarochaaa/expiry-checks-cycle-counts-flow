import { LOC_BY_ID, LOC_ORDER, PRODUCTS, productLocs } from './data';
import type { LocId, ProductId } from './data';

export type Tab = 'todo' | 'done';
export type Screen = 'tasks' | 'skus' | 'summary';
export type Pill = 'counting' | 'recount' | null;

export interface LocState {
  done: boolean;
  count: number;
  oos: boolean;
  /** processing order, newest = highest (drives the Processed tab order) */
  seq: number;
}

export interface Scan {
  loc: LocId;
  focused: boolean;
  value: string;
  /** Stock Discrepancy banner shown inside the modal (recount "starting with this one") */
  banner: boolean;
}

export interface Alert {
  id: number;
  text: string;
}

export interface State {
  screen: Screen;
  sheet: null | 'assign' | 'send';
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
  scan: Scan | null;
  detail: ProductId | null;
  /** location whose card is slid open to reveal "Out of Stock" */
  swipe: LocId | null;
  alert: Alert | null;
  /** monotonic counters */
  events: number;
  seq: number;
  alertId: number;
}

const emptyLoc = (): LocState => ({ done: false, count: 0, oos: false, seq: 0 });

export const initialState: State = {
  screen: 'tasks',
  sheet: null,
  sending: false,
  tab: 'todo',
  locs: Object.fromEntries(LOC_ORDER.map((id) => [id, emptyLoc()])) as Record<LocId, LocState>,
  recount: { sita: false, burine: false },
  recountFirst: {},
  banner: false,
  discrepancies: 0,
  scan: null,
  detail: null,
  swipe: null,
  alert: null,
  events: 0,
  seq: 0,
  alertId: 0,
};

export type Action =
  | { type: 'openTask' }
  | { type: 'closeSheet' }
  | { type: 'start' }
  | { type: 'back' }
  | { type: 'tab'; tab: Tab }
  | { type: 'scan'; loc: LocId }
  | { type: 'focus' }
  | { type: 'type'; value: string }
  | { type: 'closeScan' }
  | { type: 'submit' }
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
 * units don't match what the system expects, the whole product goes back to recount. `viaModal` keeps the
 * modal open on the location that triggered it ("starting with this one").
 */
function afterCount(s: State, loc: LocId, viaModal: boolean): State {
  const p = LOC_BY_ID[loc].product;
  if (s.recount[p]) {
    // recount finished for this product → pills disappear, discrepancy resolved
    if (productComplete(s, p)) return { ...s, recount: { ...s.recount, [p]: false }, banner: false, tab: 'done' };
    return { ...s, banner: false, tab: 'done' };
  }
  if (productComplete(s, p) && productTotal(s, p) !== PRODUCTS[p].expected) {
    const locs = { ...s.locs };
    for (const l of productLocs(p)) locs[l] = emptyLoc();
    return {
      ...s,
      locs,
      recount: { ...s.recount, [p]: true },
      recountFirst: { ...s.recountFirst, [p]: loc },
      discrepancies: s.discrepancies + 1,
      banner: !viaModal,
      tab: 'todo',
      scan: viaModal ? { loc, focused: true, value: '', banner: true } : null,
    };
  }
  return { ...s, tab: 'done' };
}

export function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'openTask':
      return { ...s, sheet: 'assign' };
    case 'closeSheet':
      return { ...s, sheet: null };
    case 'start':
      return { ...s, sheet: null, screen: 'skus', tab: 'todo' };
    case 'back':
      return { ...s, screen: 'tasks', sheet: null, scan: null, detail: null, swipe: null, alert: null };
    case 'tab':
      return { ...s, tab: a.tab, swipe: null };
    case 'scan':
      return { ...s, scan: { loc: a.loc, focused: false, value: '', banner: false }, swipe: null, alert: null };
    case 'focus':
      return s.scan ? { ...s, scan: { ...s.scan, focused: true } } : s;
    case 'type': {
      if (!s.scan) return s;
      const value = a.value.replace(/\D/g, '').slice(0, 5);
      return { ...s, scan: { ...s.scan, focused: true, value, banner: false } };
    }
    case 'closeScan':
      return { ...s, scan: null };
    case 'submit': {
      if (!s.scan || !s.scan.value) return s;
      const { loc, value } = s.scan;
      const seq = s.seq + 1;
      const next: State = {
        ...s,
        scan: null,
        events: s.events + 1,
        seq,
        locs: { ...s.locs, [loc]: { done: true, count: parseInt(value, 10), oos: false, seq } },
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
        locs: { ...s.locs, [a.loc]: { done: true, count: 0, oos: true, seq } },
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

const START: Action[] = [{ type: 'openTask' }, { type: 'start' }];
const scan = (loc: LocId): Action[] => [{ type: 'scan', loc }];
const typing = (loc: LocId): Action[] => [...scan(loc), { type: 'focus' }];
const entered = (loc: LocId, v: string): Action[] => [...typing(loc), { type: 'type', value: v }];
const count = (loc: LocId, v: string): Action[] => [...entered(loc, v), { type: 'submit' }];
const oos = (loc: LocId): Action[] => [{ type: 'swipe', loc }, { type: 'oos', loc }];
const todo: Action = { type: 'tab', tab: 'todo' };

// Reaching a given point of the flow, as the tester would
const S1: Action[] = [...START, ...count('sita1', '6'), todo];
const S2: Action[] = [...S1, ...count('sita2', '4'), todo];
const ALL: Action[] = [...S2, ...count('burine', '30')];
// Out of Stock on the last SKU → discrepancy banner on the list, recount
const RC1: Action[] = [...S2, ...oos('burine')];
const RC2: Action[] = [...RC1, ...oos('burine'), todo]; // recount: out of stock again
const RCALL: Action[] = [...RC1, ...count('burine', '30')];
// Wrong total typed on the last SKU → discrepancy shown inside the modal
const DM: Action[] = [...S2, ...entered('burine', '25'), { type: 'submit' }];

const CODES: Record<string, string> = {"tasks": "A1", "assign": "A2", "skus": "B1", "sita2-todo": "B2", "burine-todo": "B3", "burine-swipe": "B4", "burine-banner": "B5", "burine-swipe2": "B6", "alert-network": "B7", "alert-wrong": "B8", "sita1-processed": "C1", "sita2-processed": "C2", "burine-rc-processed": "C3", "burine-rc-done": "C4", "all-done": "C5", "alert-complete": "C6", "sita1-open": "D1", "sita1-typing": "D2", "sita1-entered": "D3", "sita2-open": "D4", "sita2-typing": "D5", "sita2-entered": "D6", "burine-open": "D7", "burine-typing": "D8", "burine-entered": "D9", "burine-rc-open": "D10", "burine-rc-entered": "D11", "burine-dm": "D12", "burine-rc-typing": "D14", "detail": "E1", "send": "F1", "alert-send": "F2", "loading": "G1", "summary": "H1"};
const TITLES: Record<string, string> = {"A": "Task list", "B": "SKU list · To be processed", "C": "SKU list · Processed", "D": "Scan modal", "E": "Product details", "F": "Send sheet", "G": "Sending", "H": "Summary"};
const P = (_group: string, id: string, label: string, actions: Action[]): Preset => {
  const code = CODES[id];
  return { id, code, group: `${code[0]} · ${TITLES[code[0]]}`, label, actions };
};

const RAW: Preset[] = [
  P('Entry', 'tasks', 'Task list', []),
  P('Entry', 'assign', 'Assign to me?', [{ type: 'openTask' }]),
  P('Entry', 'skus', 'SKU list · nothing counted', START),
  P('Entry', 'detail', 'Product image tapped', [...START, { type: 'detail', product: 'sita' }]),

  P('Scanning / Main', 'sita1-open', 'Sita 1 · scanned (expiry date)', [...START, ...scan('sita1')]),
  P('Scanning / Main', 'sita1-typing', 'Sita 1 · typing', [...START, ...typing('sita1')]),
  P('Scanning / Main', 'sita1-entered', 'Sita 1 · quantity entered', [...START, ...entered('sita1', '6')]),
  P('Scanning / Main', 'sita1-processed', 'Processed · 1 item', [...START, ...count('sita1', '6')]),
  P('Scanning / Main', 'sita2-todo', 'To be processed · Sita 2 on top', S1),
  P('Scanning / Main', 'sita2-open', 'Sita 2 · scanned (Counting)', [...S1, ...scan('sita2')]),
  P('Scanning / Main', 'sita2-typing', 'Sita 2 · typing', [...S1, ...typing('sita2')]),
  P('Scanning / Main', 'sita2-entered', 'Sita 2 · quantity entered', [...S1, ...entered('sita2', '4')]),
  P('Scanning / Main', 'sita2-processed', 'Processed · 2 items', [...S1, ...count('sita2', '4')]),
  P('Scanning / Main', 'burine-todo', 'To be processed · Burine (single location)', S2),
  P('Scanning / Main', 'burine-open', 'Burine · scanned', [...S2, ...scan('burine')]),
  P('Scanning / Main', 'burine-typing', 'Burine · typing', [...S2, ...typing('burine')]),
  P('Scanning / Main', 'burine-entered', 'Burine · quantity entered', [...S2, ...entered('burine', '30')]),

  P('Alerts', 'alert-network', 'Scan failed · no connection', [...START, { type: 'alert', text: ALERTS.network }]),
  P('Alerts', 'alert-wrong', 'Wrong product scanned', [...S1, { type: 'alert', text: ALERTS.wrong }]),
  P('Alerts', 'alert-complete', 'Complete failed · connection', [...ALL, { type: 'alert', text: ALERTS.error }]),
  P('Alerts', 'alert-send', 'Send failed · connection', [...ALL, { type: 'complete' }, { type: 'alert', text: ALERTS.error }]),

  P('Discrepancy & recount', 'burine-swipe', 'Burine · swiped (Out of Stock)', [...S2, { type: 'swipe', loc: 'burine' }]),
  P('Discrepancy & recount', 'burine-banner', 'Stock Discrepancy · banner on list', RC1),
  P('Discrepancy & recount', 'burine-swipe2', 'Recount · Burine swiped again', [...RC1, { type: 'swipe', loc: 'burine' }]),
  P('Discrepancy & recount', 'burine-rc-processed', 'Processed · Burine recount (00)', RC2.slice(0, -1)),
  P('Discrepancy & recount', 'burine-rc-open', 'Burine recount · scanned', [...RC1, ...scan('burine')]),
  P('Discrepancy & recount', 'burine-rc-typing', 'Burine recount · typing', [...RC1, ...typing('burine')]),
  P('Discrepancy & recount', 'burine-rc-entered', 'Burine recount · quantity entered', [...RC1, ...entered('burine', '30')]),
  P('Discrepancy & recount', 'burine-rc-done', 'All processed · after recount', RCALL),
  P('Discrepancy & recount', 'burine-dm', 'Stock Discrepancy · inside the modal', DM),

  P('End', 'all-done', 'All processed · Complete', ALL),
  P('End', 'send', 'Send inventory count', [...ALL, { type: 'complete' }]),
  P('End', 'loading', 'Sending…', [...ALL, { type: 'complete' }, { type: 'send' }]),
  P('End', 'summary', 'Task completed · summary', [...ALL, { type: 'complete' }, { type: 'send' }, { type: 'sent' }]),
];

const codeKey = (c: string) => c.charCodeAt(0) * 100 + parseInt(c.slice(1), 10);
export const PRESETS: Preset[] = [...RAW].sort((a, b) => codeKey(a.code) - codeKey(b.code));

/**
 * View code (letter + use case) of the state the tester is looking at, derived from the state itself so it
 * never drops out during free play. Keep in sync with CODES above.
 */
export function codeFor(s: State): string {
  if (s.screen === 'tasks') return s.sheet === 'assign' ? 'A2' : 'A1';
  if (s.screen === 'summary') return 'H1';
  if (s.sending) return 'G1';
  if (s.sheet === 'send') return s.alert ? 'F2' : 'F1';
  if (s.detail) return 'E1';
  if (s.scan) {
    const { loc, focused, value, banner } = s.scan;
    const step = value ? 2 : focused ? 1 : 0; // 0 scanned · 1 typing · 2 quantity entered
    if (loc === 'sita1') return `D${1 + step}`;
    if (loc === 'sita2') return `D${4 + step}`;
    if (banner) return 'D12';
    if (s.recount.burine) return ['D10', 'D14', 'D11'][step];
    return `D${7 + step}`;
  }
  const done = LOC_ORDER.filter((id) => s.locs[id].done);
  if (s.tab === 'done') {
    if (s.alert) return 'C6';
    if (s.locs.burine.oos) return 'C3';
    if (allDone(s)) return s.discrepancies > 0 ? 'C4' : 'C5';
    return done.length >= 2 ? 'C2' : 'C1';
  }
  if (s.alert) return s.alert.text === ALERTS.network ? 'B7' : 'B8';
  if (s.swipe) return s.recount.burine ? 'B6' : 'B4';
  if (s.banner) return 'B5';
  if (allDone(s)) return 'C5';
  return done.length === 0 ? 'B1' : done.length === 1 ? 'B2' : 'B3';
}
