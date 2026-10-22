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
  recount: { sita: false, salt: false, burine: false, chao: false },
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
const S3: Action[] = [...S2, ...count('salt1', '12'), todo];
const S4: Action[] = [...S3, ...count('burine', '30'), todo];
const S5: Action[] = [...S4, ...count('chao1', '8'), todo];
const RC1: Action[] = [...S5, ...oos('chao2')]; // discrepancy: Chao Tuoi back to recount, banner on the list
const RC2: Action[] = [...RC1, ...oos('chao2'), todo]; // recount of Chao 2 (out of stock again)
const RC3: Action[] = [...RC2, ...count('chao1', '8'), todo];
const SALT: Action[] = [...RC3, ...count('salt2', '8')]; // Salt discrepancy appears inside the modal
const SALT2: Action[] = [...SALT, { type: 'type', value: '8' }, { type: 'submit' }, todo];
const ALL: Action[] = [...SALT2, ...count('salt1', '12')];

const P = (group: string, id: string, label: string, actions: Action[]): Preset => ({ id, group, label, actions });

export const PRESETS: Preset[] = [
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
  P('Scanning / Main', 'salt1-todo', 'To be processed · Salt 1', S2),
  P('Scanning / Main', 'salt1-open', 'Salt 1 · scanned', [...S2, ...scan('salt1')]),
  P('Scanning / Main', 'salt1-typing', 'Salt 1 · typing', [...S2, ...typing('salt1')]),
  P('Scanning / Main', 'salt1-entered', 'Salt 1 · quantity entered', [...S2, ...entered('salt1', '12')]),
  P('Scanning / Main', 'salt1-processed', 'Processed · Salt 1 (Counting)', [...S2, ...count('salt1', '12')]),
  P('Scanning / Main', 'burine-todo', 'To be processed · Burine', S3),
  P('Scanning / Main', 'burine-open', 'Burine · scanned', [...S3, ...scan('burine')]),
  P('Scanning / Main', 'burine-typing', 'Burine · typing', [...S3, ...typing('burine')]),
  P('Scanning / Main', 'burine-entered', 'Burine · quantity entered', [...S3, ...entered('burine', '30')]),
  P('Scanning / Main', 'burine-processed', 'Processed · Burine', [...S3, ...count('burine', '30')]),
  P('Scanning / Main', 'chao1-todo', 'To be processed · Chao Tuoi 1', S4),
  P('Scanning / Main', 'chao1-open', 'Chao Tuoi 1 · scanned', [...S4, ...scan('chao1')]),
  P('Scanning / Main', 'chao1-typing', 'Chao Tuoi 1 · typing', [...S4, ...typing('chao1')]),
  P('Scanning / Main', 'chao1-entered', 'Chao Tuoi 1 · quantity entered', [...S4, ...entered('chao1', '8')]),
  P('Scanning / Main', 'chao1-processed', 'Processed · Chao Tuoi 1 (Counting)', [...S4, ...count('chao1', '8')]),
  P('Scanning / Main', 'chao2-todo', 'To be processed · Chao Tuoi 2 + Salt 2', S5),

  P('Alerts', 'alert-network', 'Scan failed · no connection', [...START, { type: 'alert', text: ALERTS.network }]),
  P('Alerts', 'alert-wrong', 'Wrong product scanned', [...S1, { type: 'alert', text: ALERTS.wrong }]),
  P('Alerts', 'alert-complete', 'Complete failed · connection', [...ALL, { type: 'alert', text: ALERTS.error }]),
  P('Alerts', 'alert-send', 'Send failed · connection', [...ALL, { type: 'complete' }, { type: 'alert', text: ALERTS.error }]),

  P('Discrepancy & recount', 'chao2-swipe', 'Chao Tuoi 2 · swiped (Out of Stock)', [...S5, { type: 'swipe', loc: 'chao2' }]),
  P('Discrepancy & recount', 'chao-banner', 'Stock Discrepancy · banner on list', RC1),
  P('Discrepancy & recount', 'chao2-swipe2', 'Recount · Chao Tuoi 2 swiped again', [...RC1, { type: 'swipe', loc: 'chao2' }]),
  P('Discrepancy & recount', 'chao2-processed', 'Processed · Chao Tuoi 2 recount (00)', [...RC1, ...oos('chao2')]),
  P('Discrepancy & recount', 'chao1-recount', 'To be processed · Chao Tuoi 1 recount', RC2),
  P('Discrepancy & recount', 'chao1-rc-open', 'Chao Tuoi 1 recount · scanned', [...RC2, ...scan('chao1')]),
  P('Discrepancy & recount', 'chao1-rc-typing', 'Chao Tuoi 1 recount · typing', [...RC2, ...typing('chao1')]),
  P('Discrepancy & recount', 'chao1-rc-entered', 'Chao Tuoi 1 recount · quantity entered', [...RC2, ...entered('chao1', '8')]),
  P('Discrepancy & recount', 'chao-rc-processed', 'Processed · Chao Tuoi recounted', [...RC2, ...count('chao1', '8')]),
  P('Discrepancy & recount', 'salt2-todo', 'To be processed · Salt 2 left', RC3),
  P('Discrepancy & recount', 'salt2-open', 'Salt 2 · scanned', [...RC3, ...scan('salt2')]),
  P('Discrepancy & recount', 'salt2-typing', 'Salt 2 · typing', [...RC3, ...typing('salt2')]),
  P('Discrepancy & recount', 'salt2-entered', 'Salt 2 · quantity entered', [...RC3, ...entered('salt2', '8')]),
  P('Discrepancy & recount', 'salt2-discrepancy', 'Stock Discrepancy · inside the modal', [...RC3, ...entered('salt2', '8'), { type: 'submit' }]),
  P('Discrepancy & recount', 'salt2-rc-typing', 'Salt 2 recount · typing', [...SALT, { type: 'type', value: '' }]),
  P('Discrepancy & recount', 'salt2-rc-entered', 'Salt 2 recount · quantity entered', [...SALT, { type: 'type', value: '8' }]),
  P('Discrepancy & recount', 'salt2-rc-processed', 'Processed · Salt 2 recount', [...SALT, { type: 'type', value: '8' }, { type: 'submit' }]),
  P('Discrepancy & recount', 'salt1-rc-todo', 'To be processed · Salt 1 recount', SALT2),
  P('Discrepancy & recount', 'salt1-rc-open', 'Salt 1 recount · scanned', [...SALT2, ...scan('salt1')]),
  P('Discrepancy & recount', 'salt1-rc-typing', 'Salt 1 recount · typing', [...SALT2, ...typing('salt1')]),
  P('Discrepancy & recount', 'salt1-rc-entered', 'Salt 1 recount · quantity entered', [...SALT2, ...entered('salt1', '12')]),

  P('End', 'all-done', 'All processed · Complete', ALL),
  P('End', 'send', 'Send inventory count', [...ALL, { type: 'complete' }]),
  P('End', 'loading', 'Sending…', [...ALL, { type: 'complete' }, { type: 'send' }]),
  P('End', 'summary', 'Task completed · summary', [...ALL, { type: 'complete' }, { type: 'send' }, { type: 'sent' }]),
];
