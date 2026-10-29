import { useState } from 'react';
import { PRODUCTS } from '../data';
import type { LocId, ProductId } from '../data';
import { LOC_GROUPS } from './CreateTask';
import type { CreatedTask } from './CreateTask';

/** What Pelican sends back: counts per location/expiry date, and per product the first count and the recount (if any). */
export interface TaskResult {
  at: string;
  counted: Partial<Record<LocId, Record<string, number>>>;
  products: Partial<Record<ProductId, { first: number; recount: number | null }>>;
}

export const expectedUnits = (p: ProductId) => LOC_GROUPS(p).reduce((n, g) => n + g.rows.reduce((m, r) => m + r.stock, 0), 0);
const finalCount = (res: TaskResult, p: ProductId) => {
  const x = res.products[p];
  return x ? (x.recount ?? x.first) : 0;
};
const dmyKey = (d: string) => d.split('/').reverse().join('');

export interface Line {
  key: string;
  locId: LocId;
  loc: string;
  firstOfLoc: boolean;
  lastOfLoc: boolean;
  date: string;
  stock: number;
  counted: number;
  /** expiry date the system did not know: the picker added it as a new batch in Pelican */
  added: boolean;
}
/**
 * Every location / expiry date line of a product as IM shows it after Pelican: the dates the system expects
 * plus any batch the picker added in Pelican (stock on hand 0), latest expiry first within each location.
 */
export function productLines(p: ProductId, res?: TaskResult): Line[] {
  return LOC_GROUPS(p).flatMap((g) => {
    const counted = res?.counted[g.id] ?? {};
    const known = new Set(g.rows.map((r) => r.date));
    const rows = [
      ...g.rows.map((r) => ({ date: r.date, stock: r.stock, added: false })),
      ...Object.keys(counted)
        .filter((d) => !known.has(d))
        .map((d) => ({ date: d, stock: 0, added: true })),
    ].sort((a, b) => dmyKey(b.date).localeCompare(dmyKey(a.date)));
    return rows.map((r, i) => ({ key: g.id + r.date, locId: g.id, loc: g.code, firstOfLoc: i === 0, lastOfLoc: i === rows.length - 1, date: r.date, stock: r.stock, counted: counted[r.date] ?? 0, added: r.added }));
  });
}

/** Products that need action in IM: the final count differs from the system, or Pelican found a batch the system does not know. */
export const discrepantProducts = (t: CreatedTask, res?: TaskResult): ProductId[] =>
  res ? t.products.filter((p) => finalCount(res, p) !== expectedUnits(p) || productLines(p, res).some((l) => l.added && l.counted > 0)) : [];

export interface Totals {
  skus: number;
  items: number;
  discrepancies: number;
}
export function taskTotals(t: CreatedTask, res?: TaskResult, adjusted?: boolean): Totals {
  return { skus: t.skus, items: t.products.reduce((n, p) => n + expectedUnits(p), 0), discrepancies: adjusted ? 0 : discrepantProducts(t, res).length };
}

const Svg = ({ children, size = 16, sw = 2 }: { children: React.ReactNode; size?: number; sw?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {children}
  </svg>
);
const I = {
  dl: <Svg size={18}><path d="M12 3v12M7 11l5 5 5-5M4 21h16" /></Svg>,
  pencil: <Svg size={18} sw={2.4}><path d="M4 20l4-1 11-11-3-3L5 16l-1 4zM14 7l3 3" /></Svg>,
  store: <Svg size={18} sw={2.4}><rect x="3" y="4" width="18" height="5" /><path d="M5 9v11h14V9M10 13h4" /></Svg>,
  created: <Svg size={20} sw={2.4}><path d="M20 12a8 8 0 1 1-3-6.2M20 4v5h-5" /></Svg>,
  up: <Svg size={14} sw={2.6}><path d="M6 15l6-6 6 6" /></Svg>,
  sku: <Svg size={14}><path d="M10 3h4v4l2 3v11H8V10l2-3V3z" /></Svg>,
  items: <Svg size={14}><path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5" /></Svg>,
  disc: <Svg size={14}><path d="M4 6h10M4 12h10M4 18h6M17 14l3 3 3-5" /></Svg>,
  bulb: <Svg size={34} sw={2}><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z" /></Svg>,
  close: <Svg size={18} sw={2.6}><path d="M6 6l12 12M18 6L6 18" /></Svg>,
  minus: <Svg size={18} sw={2.6}><circle cx="12" cy="12" r="9.5" /><path d="M8 12h8" /></Svg>,
  plus: <Svg size={18} sw={2.6}><circle cx="12" cy="12" r="9.5" /><path d="M8 12h8M12 8v8" /></Svg>,
  info: <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden><circle cx="12" cy="12" r="11" fill="#000" /><path d="M12 11v6M12 7v1.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" /></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden><circle cx="12" cy="12" r="11" fill="#1db954" /><path d="M7 12.5l3.5 3.5L17 9" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>,
};
const ring = (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="#fff" aria-hidden>
    <circle cx="13" cy="13" r="9" strokeWidth="2.2" />
    <circle cx="13" cy="13" r="4.2" strokeWidth="2.2" strokeDasharray="3 2" />
  </svg>
);
const dot = (ok: boolean) =>
  ok ? (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden><circle cx="12" cy="12" r="11" fill="#1db954" /></svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden><circle cx="12" cy="12" r="11" fill="#e1262d" /><path d="M7 12h10" stroke="#fff" strokeWidth="3" strokeLinecap="round" /></svg>
  );

const ymd = (dmy: string) => dmy.split('/').reverse().join('.');

export function TaskDetail({ task, res, adjusted, status, date, time, onClose, onAdjust, onRecount }: { task: CreatedTask; res?: TaskResult; adjusted: boolean; status: ReactNodeLike; date: string; time: string; onClose: () => void; onAdjust: () => void; onRecount: () => void }) {
  const tot = taskTotals(task, res, adjusted);
  const disc = discrepantProducts(task, res);
  const picker = res ? 'Pelican user' : 'Unassigned';
  const stamp = `${date.split('.').reverse().join('.')} ${time}:00`;
  return (
    <div className="tdv">
      <div className="tdv__bar">
        <span>{task.id}</span>
        <button type="button" aria-label="Download" className="tdv__icon">
          {I.dl}
        </button>
      </div>
      <div className="tdv__head">
        <span className="tdv__store">
          {I.store}
          <b>QA_001_Test_Store</b>
        </span>
        <span className="tdv__ids">
          Cycle Count ID: <b>#{task.id}</b>
          <br />
          Batch ID: <b>#{3561000 + (Number(task.id) % 1000)}</b>
        </span>
        <span className="tdv__picker">
          <b>Picker</b>: {picker}
        </span>
        <span className="tdv__status">{status}</span>
        <span className="tdv__actions">
          Actions:
          <button type="button" aria-label="Adjust discrepancies" className="tdv__icon" disabled={!res || disc.length === 0 || adjusted} onClick={onAdjust}>
            {I.pencil}
          </button>
          {res && disc.length > 0 && !adjusted && (
            <button type="button" className="tdv__disc" aria-label="Recount list" onClick={onRecount}>
              {ring}
            </button>
          )}
        </span>
        <button type="button" className="tdv__chev" aria-label={`Collapse task ${task.id}`} onClick={onClose}>
          {I.up}
        </button>
      </div>

      <div className="tdv__panel">
        <div className="tdv__top">
          <div className="tdv__kpis">
            <div className="tdv-kpi">
              <span>{I.sku}Total SKUs</span>
              <b>{tot.skus}</b>
            </div>
            <div className="tdv-kpi">
              <span>{I.items}Total Items</span>
              <b>{tot.items}</b>
            </div>
            <div className="tdv-kpi">
              <span>{I.disc}Discrepancies</span>
              <b>{tot.discrepancies}</b>
            </div>
          </div>
          <div className="tdv__meta">
            <span>
              {I.created}
              <b>Created by: Auto Creation</b>
            </span>
            <span>
              <b>Picker</b>: {picker}
            </span>
          </div>
        </div>

        <div className="tdv__table">
          <div className="tdv__row tdv__row--head">
            <span>PRODUCT &amp; SKU</span>
            <span>STOCK ON HAND</span>
            <span>COUNTED</span>
            <span>
              RE-COUNTED
              <em>(From Pelican)</em>
            </span>
            <span>
              RE-COUNTED
              <em>(From IM)</em>
            </span>
            <span className="tdv__date-h">DATE {I.info}</span>
            <span />
          </div>
          {task.products.map((p) => {
            const pr = PRODUCTS[p];
            const exp = expectedUnits(p);
            const r = res?.products[p];
            const isDisc = disc.includes(p);
            return (
              <div key={p} className="tdv__row">
                <span className="tdv__prod">
                  <img src={pr.image} alt="" />
                  <span>
                    {pr.name}
                    <small>
                      SKU: <b>{pr.sku}</b>
                    </small>
                  </span>
                </span>
                <span>{exp}</span>
                <span className="tdv__cnt">
                  {r ? (
                    <>
                      {dot(r.first === exp)}
                      {r.first}
                    </>
                  ) : (
                    '-'
                  )}
                </span>
                <span className="tdv__cnt">
                  {r && r.recount != null ? (
                    <>
                      {dot(r.recount === exp)}
                      {r.recount}
                    </>
                  ) : (
                    '-'
                  )}
                </span>
                <span className="tdv__cnt">
                  {adjusted && isDisc ? (
                    <>
                      {dot(true)}
                      {exp}
                    </>
                  ) : (
                    '-'
                  )}
                </span>
                <span>{res ? stamp : '-'}</span>
                <span className="tdv__i">{res ? I.info : null}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
type ReactNodeLike = React.ReactNode;

/** "Manual Adjust Batch": per location / expiry date, what was counted vs. the system, with an adjustment per line. */
export function AdjustModal({ task, res, onClose, onAdjust }: { task: CreatedTask; res: TaskResult; onClose: () => void; onAdjust: () => void }) {
  const prods = discrepantProducts(task, res);
  const lines = (p: ProductId) => productLines(p, res);
  const [adj, setAdj] = useState<Record<string, number>>(() => Object.fromEntries(prods.flatMap((p) => lines(p).map((l) => [l.key, l.counted - l.stock]))));
  const tot = taskTotals(task, res, false);
  const sign = (n: number) => (n > 0 ? `+${n}` : String(n));
  const cls = (n: number) => (n < 0 ? 'am-neg' : n > 0 ? 'am-pos' : undefined);
  return (
    <div className="im-modal-wrap" onClick={onClose}>
      <div className="am" role="dialog" aria-label="Manual Adjust Batch" onClick={(e) => e.stopPropagation()}>
        <header className="am__head">
          <h2>Manual Adjust Batch</h2>
          <button type="button" className="am__close" aria-label="Close" onClick={onClose}>
            {I.close}
          </button>
        </header>
        <div className="am__body">
          <div className="am__top">
            <h3>Discrepancy Summary</h3>
            <div className="tdv__kpis">
              <div className="tdv-kpi">
                <span>{I.sku}Total SKUs</span>
                <b>{tot.skus}</b>
              </div>
              <div className="tdv-kpi">
                <span>{I.items}Total Items</span>
                <b>{tot.items}</b>
              </div>
              <div className="tdv-kpi">
                <span>{I.disc}Discrepancies</span>
                <b>{tot.discrepancies}</b>
              </div>
            </div>
          </div>
          <div className="am__tip">
            {I.bulb}
            <div>
              <p>
                When adjusting stock in <b>Locations</b> with <b>Multiple Expiration Dates</b>:
              </p>
              <ul>
                <li>
                  If you’re <b>decreasing stock</b>, it will be taken from the <b>longest expiration date</b>.
                </li>
                <li>
                  If you’re <b>increasing stock</b>, it will be placed in the <b>closest expiration date</b>.
                </li>
              </ul>
            </div>
          </div>
          <div className="am__table">
            <div className="am__row am__row--head">
              <span>SKU</span>
              <span>LOCATIONS</span>
              <span>
                EXPIRY DATES<em>(PER LOCATION)</em>
              </span>
              <span>
                STOCK ON HAND<em>(PER EXPIRY DATE)</em>
              </span>
              <span>
                UNITS COUNTED<em>(PER LOCATION)</em>
              </span>
              <span>
                DISCREPANT UNITS FOUND<em>(PER LOCATION)</em>
              </span>
              <span className="am__center">ADJUST</span>
            </div>
            {prods.map((p) => {
              const ls = lines(p);
              const sum = (f: (l: (typeof ls)[number]) => number) => ls.reduce((n, l) => n + f(l), 0);
              const totalAdj = ls.reduce((n, l) => n + adj[l.key], 0);
              return (
                <div key={p} className="am__block">
                  <div className="am__lines">
                    {ls.map((l, i) => {
                      const d = l.counted - l.stock;
                      return (
                        <div key={l.key} className={`am__row${l.lastOfLoc ? ' am__row--lastloc' : ''}`}>
                          <span className="am__sku">
                            {i === 0 && (
                              <>
                                <img src={PRODUCTS[p].image} alt="" />
                                <span>
                                  <b>{PRODUCTS[p].name}</b>
                                  <small>SKU: {PRODUCTS[p].sku}</small>
                                </span>
                              </>
                            )}
                          </span>
                          <span className="am__loc">{l.firstOfLoc ? l.loc : ''}</span>
                          <span className="am__date">
                            {ymd(l.date)}
                            {l.added && <i className="am__new">New batch</i>}
                          </span>
                          <span>{l.stock}</span>
                          <span>{l.counted}</span>
                          <span className={cls(d)}>{d === 0 ? 0 : sign(d)}</span>
                          <span className="am__center">
                            <span className="am-step">
                              <button type="button" aria-label="Decrease" onClick={() => setAdj({ ...adj, [l.key]: adj[l.key] - 1 })}>
                                {I.minus}
                              </button>
                              <b>{adj[l.key]}</b>
                              <button type="button" aria-label="Increase" onClick={() => setAdj({ ...adj, [l.key]: adj[l.key] + 1 })}>
                                {I.plus}
                              </button>
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="am__row am__row--total">
                    <span />
                    <span className="am__totalcell">TOTAL</span>
                    <span>{sum((l) => l.stock)}</span>
                    <span>{sum((l) => l.counted)}</span>
                    <span className={cls(sum((l) => l.counted - l.stock))}>{sign(sum((l) => l.counted - l.stock))}</span>
                    <span className="am__center am__sum">
                      {sign(totalAdj)} {I.check}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="am__foot">
          <button type="button" className="am__go" onClick={onAdjust}>
            Adjust
          </button>
        </div>
      </div>
    </div>
  );
}

/** "Recount list": the products that still show a discrepancy, grouped by location, to send back for a recount. */
export function RecountModal({ task, res, onClose, onRequest }: { task: CreatedTask; res: TaskResult; onClose: () => void; onRequest: (n: number) => void }) {
  const prods = discrepantProducts(task, res);
  const tot = taskTotals(task, res, false);
  const sign = (n: number) => (n > 0 ? `+${n}` : String(n));
  return (
    <div className="im-modal-wrap" onClick={onClose}>
      <div className="am" role="dialog" aria-label="Recount List" onClick={(e) => e.stopPropagation()}>
        <header className="am__head">
          <h2>Recount List</h2>
          <button type="button" className="am__close" aria-label="Close" onClick={onClose}>
            {I.close}
          </button>
        </header>
        <div className="am__body">
          <div className="am__top">
            <h3>Products to recount</h3>
            <div className="tdv__kpis">
              <div className="tdv-kpi">
                <span>{I.sku}Total SKUs</span>
                <b>{tot.skus}</b>
              </div>
              <div className="tdv-kpi">
                <span>{I.disc}To recount</span>
                <b>{prods.length}</b>
              </div>
            </div>
          </div>
          <div className="am__table">
            <div className="am__row am__row--head am__row--recount">
              <span>PRODUCT &amp; SKU</span>
              <span>LOCATIONS</span>
              <span>
                EXPIRY DATES<em>(PER LOCATION)</em>
              </span>
              <span>
                STOCK ON HAND<em>(PER EXPIRY DATE)</em>
              </span>
              <span>
                UNITS COUNTED<em>(PER LOCATION)</em>
              </span>
              <span>
                DISCREPANT UNITS<em>(PER LOCATION)</em>
              </span>
            </div>
            {prods.map((p) => (
              <div key={p} className="am__block">
                <div className="am__lines">
                  {productLines(p, res).map((l, i) => {
                    const d = l.counted - l.stock;
                    return (
                      <div key={l.key} className={`am__row am__row--recount${l.lastOfLoc ? ' am__row--lastloc' : ''}`}>
                        <span className="am__sku">
                          {i === 0 && (
                            <>
                              <img src={PRODUCTS[p].image} alt="" />
                              <span>
                                <b>{PRODUCTS[p].name}</b>
                                <small>SKU: {PRODUCTS[p].sku}</small>
                              </span>
                            </>
                          )}
                        </span>
                        <span className="am__loc">{l.firstOfLoc ? l.loc : ''}</span>
                        <span className="am__date">
                          {ymd(l.date)}
                          {l.added && <i className="am__new">New batch</i>}
                        </span>
                        <span>{l.stock}</span>
                        <span>{l.counted}</span>
                        <span className={d < 0 ? 'am-neg' : d > 0 ? 'am-pos' : undefined}>{d === 0 ? 0 : sign(d)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="am__foot">
          <button type="button" className="am__go" onClick={() => onRequest(prods.length)}>
            Request recount
          </button>
        </div>
      </div>
    </div>
  );
}
