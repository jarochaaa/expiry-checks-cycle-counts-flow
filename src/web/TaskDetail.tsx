import { useState } from 'react';
import { PRODUCTS } from '../data';
import type { LocId, ProductId } from '../data';
import { LOC_GROUPS } from './CreateTask';
import type { CreatedTask } from './CreateTask';

/** Counts sent back from Pelican: location → expiry date (DD/MM/YYYY) → units counted */
export interface TaskResult {
  at: string;
  counted: Partial<Record<LocId, Record<string, number>>>;
}

const Ico = ({ children, size = 12 }: { children: React.ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {children}
  </svg>
);
const dl = <Ico><path d="M12 3v12M7 11l5 5 5-5M4 21h16" /></Ico>;
const clip = <Ico size={14}><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4h6v3H9zM9 14l2 2 4-4" /></Ico>;
const down = <Ico><path d="M12 4v16M6 14l6 6 6-6" /></Ico>;
const funnel = <Ico size={18}><path d="M3 4h18l-7 9v6l-4 2v-8L3 4z" /></Ico>;
const layers = <Ico size={14}><path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5" /></Ico>;
const bottle = <Ico size={14}><path d="M10 3h4v4l2 3v11H8V10l2-3V3z" /></Ico>;
const minus = (
  <svg width="17" height="16" viewBox="0 0 17 16" aria-hidden>
    <circle cx="8.4" cy="8" r="7.8" fill="#000" />
    <rect x="4.6" y="7" width="7.6" height="2" rx="1" fill="#fff" />
  </svg>
);
const plus = (
  <svg width="17" height="16" viewBox="0 0 17 16" aria-hidden>
    <circle cx="8.4" cy="8" r="7.8" fill="#000" />
    <rect x="4.6" y="7" width="7.6" height="2" rx="1" fill="#fff" />
    <rect x="7.4" y="4.2" width="2" height="7.6" rx="1" fill="#fff" />
  </svg>
);

/** Stepper pill (Input-Discrepancy): -  n  + */
function Adjust({ start }: { start: number }) {
  const [v, setV] = useState(start);
  const sign = (n: number) => (n > 0 ? `+${n}` : String(n));
  return (
    <span className="td-adj">
      <button type="button" aria-label="Decrease adjustment" onClick={() => setV(v - 1)}>
        {minus}
      </button>
      <b>{sign(v)}</b>
      <button type="button" aria-label="Increase adjustment" onClick={() => setV(v + 1)}>
        {plus}
      </button>
    </span>
  );
}

const Reason = () => (
  <button type="button" className="td-reason">
    Select reason
    {down}
  </button>
);

export interface Totals {
  skus: number;
  units: number;
  discrepancies: number;
}

/** Derived numbers for a task: shared by the collapsed row (status) and the expanded panel. */
export function taskTotals(t: CreatedTask, res?: TaskResult): Totals {
  let units = 0;
  let discrepancies = 0;
  for (const p of t.products)
    for (const g of LOC_GROUPS(p))
      for (const r of g.rows) {
        units += res ? (res.counted[g.id]?.[r.date] ?? 0) : r.stock;
        if (res && (res.counted[g.id]?.[r.date] ?? 0) !== r.stock) discrepancies++;
      }
  return { skus: t.skus, units, discrepancies };
}

export function TaskDetail({ task, res, date, time }: { task: CreatedTask; res?: TaskResult; date: string; time: string }) {
  const tot = taskTotals(task, res);
  const stamp = (
    <>
      {date}
      <i>{time}</i>
    </>
  );
  return (
    <div className="td">
      <div className="td__top">
        <div className="td__kpis">
          <div className="td-kpi">
            <span className="td-kpi__icon">{layers}</span>
            <span className="td-kpi__label">Total SKUs</span>
            <b>{tot.skus}</b>
          </div>
          <div className="td-kpi">
            <span className="td-kpi__icon">{layers}</span>
            <span className="td-kpi__label">Total Units</span>
            <b>{tot.units}</b>
          </div>
          <div className="td-kpi">
            <span className="td-kpi__icon">{bottle}</span>
            <span className="td-kpi__label">Discrepancies</span>
            <b>{tot.discrepancies}</b>
          </div>
        </div>
        <p className="td__picker">Picker: {res ? 'Pelican user' : 'Unassigned'}</p>
      </div>

      <div className="td__actions">
        <b>Actions:</b>
        <button type="button" className="td-btn">
          {dl}
          Download
        </button>
        <button type="button" className="td-btn td-btn--go" disabled={!res}>
          {clip}
          Adjust and complete
        </button>
      </div>

      <button type="button" className="td__filter">
        <span>
          {funnel}
          <b>Filter</b>
        </span>
        <span className="td__filter-btn">{down}</span>
      </button>

      <div className="td__table">
        <div className="td-head">
          <span className="td-head__sku">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M8 4v16M4 8l4-4 4 4M16 20V4M12 16l4 4 4-4" />
            </svg>
            <em>Image</em>
            <em>SKU</em>
          </span>
          <span>Location</span>
          <span>
            Expiry
            <br />
            date
          </span>
          <span>
            Stock on
            <br />
            hand
          </span>
          <span>Counted/ removed</span>
          <span>Task</span>
          <span>Date</span>
          <span>Adjustment</span>
        </div>
        <div className="td__list">
          {task.products.map((p: ProductId) => {
            const pr = PRODUCTS[p];
            return (
              <article key={p} className="td-card">
                <div className="td-prod">
                  <span className="td-prod__img">
                    <img src={pr.image} alt="" />
                  </span>
                  <span className="td-prod__info">
                    <span>{pr.name}</span>
                    <span>
                      <b>Barcode</b>: {pr.barcode}
                    </span>
                    <span>
                      <b>SKU</b>: {pr.sku}
                    </span>
                  </span>
                </div>
                <div className="td-groups">
                  {LOC_GROUPS(p).map((g) => (
                    <div key={g.id} className="td-group">
                      <span className="td-loc">{g.code}</span>
                      <div className="td-lines">
                        {g.rows.map((r) => {
                          const counted = res ? (res.counted[g.id]?.[r.date] ?? 0) : null;
                          const delta = counted == null ? 0 : counted - r.stock;
                          return (
                            <div key={r.date} className="td-line">
                              <span>{r.date}</span>
                              <span>{r.stock}</span>
                              <span className={delta !== 0 ? 'td-bad' : undefined}>{counted ?? '–'}</span>
                              <span>Expiry Check</span>
                              <span className="td-stamp">{stamp}</span>
                              <span className="td-adjcell">
                                {counted == null ? null : delta === 0 ? (
                                  <b className="td-zero">0</b>
                                ) : (
                                  <>
                                    <Adjust start={delta} />
                                    <Reason />
                                  </>
                                )}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
