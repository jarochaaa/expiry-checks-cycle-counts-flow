import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { LOCS, PRODUCTS } from '../data';
import type { ProductId } from '../data';

type Tab = 'counting' | 'removal';
type Pick = 'random' | 'hybrid' | 'manual' | 'expiry' | 'wall';
type Gran = 'location' | 'expiry';

const S = ({ children, size = 20 }: { children: ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {children}
  </svg>
);
const I = {
  shuffle: <S size={22}><path d="M3 7h4l10 10h4M3 17h4l3-3M14 10l3-3h4M18 4l3 3-3 3M18 14l3 3-3 3" /></S>,
  hybrid: <S size={22}><path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4" /><rect x="9" y="9" width="6" height="6" /></S>,
  upload: <S size={22}><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8l-5-5zM14 3v5h5M12 17v-6M9.5 13.5L12 11l2.5 2.5" /></S>,
  expiry: <S size={22}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /><circle cx="16" cy="16" r="3" /></S>,
  pin: <S size={22}><path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></S>,
  wall: <S size={22}><circle cx="12" cy="12" r="6" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M4 4l16 16" /></S>,
  hourglass: <S size={18}><path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9" /></S>,
  csv: <S size={34}><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8l-5-5zM14 3v5h5" /></S>,
  arrow: <S size={16}><path d="M5 12h14M13 6l6 6-6 6" /></S>,
  back: <S size={16}><path d="M19 12H5M11 6l-6 6 6 6" /></S>,
  up: <S size={16}><path d="M12 20V4M6 10l6-6 6 6" /></S>,
  down: <S size={14}><path d="M6 9l6 6 6-6" /></S>,
  caretUp: <S size={14}><path d="M6 15l6-6 6 6" /></S>,
  funnel: <S size={20}><path d="M3 4h18l-7 9v6l-4 2v-8L3 4z" /></S>,
  dl: <S size={14}><path d="M12 4v11M7 11l5 5 5-5M5 20h14" /></S>,
  check: <S size={12}><path d="M5 12l5 5L19 7" /></S>,
  minus: <S size={14}><path d="M5 12h14" /></S>,
  plus: <S size={14}><path d="M12 5v14M5 12h14" /></S>,
  bottle: <S size={16}><path d="M10 3h4v4l2 3v11H8V10l2-3V3z" /></S>,
  layers: <S size={16}><path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5" /></S>,
  cal: <S size={16}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></S>,
  prev: <S size={14}><path d="M15 6l-6 6 6 6" /></S>,
  next: <S size={14}><path d="M9 6l6 6-6 6" /></S>,
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const parseDate = (v: string) => {
  const [d, m, y] = v.split('/').map(Number);
  return d && m && y ? new Date(y, m - 1, d) : new Date(2026, 6, 1);
};

/** Calendar popover used by Start / End Date. */
function DatePicker({ value, onPick, onClose }: { value: string; onPick: (v: string) => void; onClose: () => void }) {
  const sel = parseDate(value);
  const [view, setView] = useState({ y: sel.getFullYear(), m: sel.getMonth() });
  const first = new Date(view.y, view.m, 1).getDay();
  const days = new Date(view.y, view.m + 1, 0).getDate();
  const go = (delta: number) => {
    const n = view.y * 12 + view.m + delta;
    setView({ y: Math.floor(n / 12), m: n % 12 });
  };
  return (
    <div className="ct-cal" role="dialog" aria-label="Choose a date" onClick={(e) => e.stopPropagation()}>
      <div className="ct-cal__nav">
        <button type="button" aria-label="Previous month" onClick={() => go(-1)}>
          {I.prev}
        </button>
        <b>
          {MONTHS[view.m]} {view.y}
        </b>
        <button type="button" aria-label="Next month" onClick={() => go(1)}>
          {I.next}
        </button>
      </div>
      <div className="ct-cal__grid">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((w, i) => (
          <span key={i} className="ct-cal__dow">
            {w}
          </span>
        ))}
        {Array.from({ length: first }, (_, i) => (
          <span key={`b${i}`} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const day = i + 1;
          const on = sel.getFullYear() === view.y && sel.getMonth() === view.m && sel.getDate() === day;
          return (
            <button key={day} type="button" aria-label={`${day} ${MONTHS[view.m]} ${view.y}`} aria-pressed={on} className={on ? 'ct-cal__day ct-cal__day--on' : 'ct-cal__day'} onClick={() => (onPick(`${day}/${view.m + 1}/${view.y}`), onClose())}>
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* --- the 3 Pelican products, split into expiry-level rows (same dates / locations as the app) --- */
interface Row {
  product: ProductId;
  date: string;
  stock: number;
  loc: string;
}
const ORDER: ProductId[] = ['sita', 'burine', 'chao'];
/** One row per location and expiry date: a product that sits in several locations is listed once for each of them. */
const rowsFor = (p: ProductId): Row[] =>
  LOCS.filter((l) => l.product === p).flatMap((loc) => loc.dates.map((d, i) => ({ product: p, date: d.replace(/\./g, '/'), stock: loc.pass[i], loc: loc.code })));
export const STOCK_ROWS = rowsFor;
/** Per location: the expiry dates with the units the system expects there (stock on hand). */
export const LOC_GROUPS = (p: ProductId) =>
  LOCS.filter((l) => l.product === p).map((l) => ({ id: l.id, code: l.code, rows: l.dates.map((d, i) => ({ date: d.replace(/\./g, '/'), stock: l.pass[i] })) }));
const sum = (r: Row[]) => r.reduce((n, x) => n + x.stock, 0);

export interface CreatedTask {
  id: string;
  date: string;
  skus: number;
  products: ProductId[];
}

export interface CreateInitial {
  step: 1 | 2;
  /** Expiry Checks tile + granularity already chosen (step 1) */
  pick?: boolean;
  batches?: number;
  expand?: boolean;
}

export function CreateTask({ onClose, onCreate, initial, onView }: { onClose: () => void; onCreate: (tasks: CreatedTask[]) => void; initial?: CreateInitial; onView?: (code: string) => void }) {
  const [step, setStep] = useState<1 | 2>(initial?.step ?? 1);
  const [tab, setTab] = useState<Tab>('counting');
  const [pick, setPick] = useState<Pick | null>(initial?.step === 2 || initial?.pick ? 'expiry' : null);
  const [gran, setGran] = useState<Gran | null>(initial?.step === 2 || initial?.pick ? 'expiry' : null);
  const [picking, setPicking] = useState<'start' | 'end' | null>(null);
  const [removal, setRemoval] = useState(false);

  // step 2
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [range, setRange] = useState<'week' | '15' | '30' | 'custom'>('30');
  const [start, setStart] = useState('1/7/2026');
  const [end, setEnd] = useState('1/8/2026');
  const [totalSkus, setTotalSkus] = useState(3);
  const [batchCount, setBatchCount] = useState(initial?.batches ?? 1);
  const [checked, setChecked] = useState<Record<number, boolean>>({ 0: true, 1: true, 2: true });
  const [expanded, setExpanded] = useState<number | null>(initial?.expand ? 0 : null);

  const products = ORDER.slice(0, totalSkus);
  const batches = useMemo(() => {
    const n = Math.min(batchCount, products.length);
    const out: ProductId[][] = Array.from({ length: n }, () => []);
    products.forEach((p, i) => out[Math.min(n - 1, Math.floor((i * n) / products.length))].push(p));
    return out;
  }, [products, batchCount]);
  const allRows = products.flatMap(rowsFor);
  const selected = batches.map((_, i) => checked[i] !== false);
  const selectedCount = selected.filter(Boolean).length;

  const code = step === 1 ? (tab === 'counting' && pick ? 'IM4' : 'IM3') : expanded != null ? 'IM6' : 'IM5';
  useEffect(() => {
    onView?.(code);
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  const canNext = tab === 'counting' ? pick === 'expiry' && gran === 'expiry' : removal;
  const showGran = tab === 'counting' && (pick === 'random' || pick === 'hybrid' || pick === 'manual' || pick === 'expiry');

  const setRangeAndDates = (r: typeof range) => {
    setRange(r);
    if (r !== 'custom') {
      const days = r === 'week' ? 7 : r === '15' ? 15 : 30;
      const d = new Date(2026, 6, 1 + days);
      setStart('1/7/2026');
      setEnd(`${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`);
    }
  };
  const clearAll = () => {
    setRange('30');
    setStart('1/7/2026');
    setEnd('1/8/2026');
    setTotalSkus(3);
    setBatchCount(1);
    setChecked({ 0: true, 1: true, 2: true });
  };

  const create = () => {
    const now = new Date();
    const date = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} – ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const tasks = batches
      .map((b, i) => ({ b, i }))
      .filter(({ i }) => selected[i])
      .map(({ b }, k) => ({ id: String(67891 + k), date, skus: b.length, products: b }));
    onCreate(tasks);
  };

  const Tile = ({ id, icon, label, sub, on, onClick, wide, disabled }: { id?: string; icon: ReactNode; label: ReactNode; sub?: string; on?: boolean; onClick?: () => void; wide?: boolean; disabled?: boolean }) => (
    <button type="button" data-id={id} className={['ct-tile', on && 'ct-tile--on', wide && 'ct-tile--wide', disabled && 'ct-tile--off'].filter(Boolean).join(' ')} aria-pressed={on} disabled={disabled} onClick={onClick}>
      <span className="ct-tile__icon">{icon}</span>
      <span className="ct-tile__label">{label}</span>
      {sub && <span className="ct-tile__sub">{sub}</span>}
    </button>
  );

  return (
    <div className="im-modal-wrap" onClick={onClose}>
      <div className="ct" role="dialog" aria-label="Create a Count Task" onClick={(e) => e.stopPropagation()}>
        <header className="ct__head">
          <h2>{step === 1 ? 'Create a Count Task' : 'Expiry Checks'}</h2>
          <button type="button" className="ct__close" aria-label="Close" onClick={onClose}>
            {I.arrow}
          </button>
        </header>
        <div className="ct__form">
          <div className="ct__step">
            {step === 2 && (
              <button type="button" className="ct__back" aria-label="Back" onClick={() => setStep(1)}>
                {I.back}
              </button>
            )}
            <h3>{step === 1 ? '1. Select the SKUs to be added' : '2. Batches'}</h3>
            <span className={`ct__pager ct__pager--${step}`} aria-hidden>
              <i />
              <i />
            </span>
          </div>

          {step === 1 ? (
            <div className="ct__scroll">
              <div className="ct__seg" role="tablist">
                <button type="button" role="tab" aria-selected={tab === 'counting'} onClick={() => setTab('counting')}>
                  Counting Tasks
                </button>
                <button type="button" role="tab" aria-selected={tab === 'removal'} onClick={() => setTab('removal')}>
                  Removal Tasks
                </button>
              </div>

              {tab === 'counting' ? (
                <>
                  <div className="ct__card">
                    <p>Creation Batches</p>
                    <div className="ct__tiles">
                      <Tile id="random" icon={I.shuffle} label="Random Sample" on={pick === 'random'} onClick={() => setPick('random')} />
                      <Tile id="hybrid" icon={I.hybrid} label="Hybrid Sample" on={pick === 'hybrid'} onClick={() => setPick('hybrid')} />
                      <Tile id="manual" icon={I.upload} label={<>Manual (Upload<br />CSV)</>} on={pick === 'manual'} onClick={() => setPick('manual')} />
                      <Tile id="expiry" icon={I.expiry} label="Expiry Checks" on={pick === 'expiry'} onClick={() => setPick('expiry')} />
                    </div>
                    {pick === 'manual' && (
                      <div className="ct__upload">
                        <div className="ct__upload-head">
                          <span>Upload CSV file</span>
                          <button type="button" className="ct__dl">
                            Download {I.dl}
                          </button>
                        </div>
                        <div className="ct__drop">
                          {I.csv}
                          <b>Drop files or</b>
                          <button type="button" className="ct__click">
                            Click Here
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {showGran && (
                    <div className="ct__card">
                      <p>Choose the granularity of the counting task</p>
                      <div className="ct__tiles ct__tiles--2">
                        <Tile id="location" icon={I.pin} label={<b>Count Checks</b>} sub="Count units for each location" on={gran === 'location'} onClick={() => setGran('location')} />
                        <Tile id="gexpiry" icon={I.expiry} label={<b>Expiry Checks</b>} sub="Count units for each expiry" on={gran === 'expiry'} onClick={() => setGran('expiry')} />
                      </div>
                    </div>
                  )}

                  <div className="ct__card">
                    <Tile id="wall" wide icon={I.wall} label={<>Wall to Wall<br />(Full store count)</>} on={pick === 'wall'} onClick={() => setPick('wall')} />
                  </div>
                </>
              ) : (
                <div className="ct__card">
                  <p>Creation Batches</p>
                  <div className="ct__tiles ct__tiles--2 ct__tiles--removal">
                    <Tile id="expired" icon={I.wall} label="Remove Expired Units" on={removal} onClick={() => setRemoval(!removal)} />
                    <Tile icon={I.hourglass} label={<>Remove Units Past Freshness<br />Guarantee</>} sub="Coming soon" disabled />
                  </div>
                </div>
              )}

              <div className="ct__next">
                <button type="button" aria-label="Next" disabled={!canNext} className={canNext ? 'ct__fab ct__fab--on' : 'ct__fab'} onClick={() => canNext && tab === 'counting' && setStep(2)}>
                  {I.arrow}
                </button>
              </div>
            </div>
          ) : (
            <div className="ct__scroll ct__scroll--2">
              <section className="ct__filters">
                <button type="button" className="ct__filters-head" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)}>
                  <span>
                    {I.funnel}
                    <b>Results Filtered by</b>
                  </span>
                  {filtersOpen ? I.up : I.down}
                </button>
                {filtersOpen && (
                  <>
                    <p className="ct__label">Select Expiry Time Range Upcoming In:</p>
                    <div className="ct__chips">
                      {([['week', 'Week'], ['15', '15 days'], ['30', '30 Days'], ['custom', 'Custom']] as const).map(([k, l]) => (
                        <button key={k} type="button" aria-pressed={range === k} onClick={() => setRangeAndDates(k)}>
                          {l}
                        </button>
                      ))}
                    </div>
                    <div className="ct__dates">
                      <div className="ct__date">
                        <b>Start Date</b>
                        <button type="button" className="ct__date-field" aria-haspopup="dialog" aria-expanded={picking === 'start'} onClick={() => setPicking(picking === 'start' ? null : 'start')}>
                          <span>{start}</span>
                          {I.cal}
                        </button>
                        {picking === 'start' && <DatePicker value={start} onPick={(v) => (setStart(v), setRange('custom'))} onClose={() => setPicking(null)} />}
                      </div>
                      <div className="ct__date">
                        <b>End Date</b>
                        <button type="button" className="ct__date-field" aria-haspopup="dialog" aria-expanded={picking === 'end'} onClick={() => setPicking(picking === 'end' ? null : 'end')}>
                          <span>{end}</span>
                          {I.cal}
                        </button>
                        {picking === 'end' && <DatePicker value={end} onPick={(v) => (setEnd(v), setRange('custom'))} onClose={() => setPicking(null)} />}
                      </div>
                    </div>
                    <div className="ct__filter-actions">
                      <button type="button" className="ct__ghost" onClick={clearAll}>
                        {I.back} Clear All
                      </button>
                      <button type="button" className="ct__dark" onClick={() => setFiltersOpen(false)}>
                        Apply Filters
                      </button>
                    </div>
                  </>
                )}
              </section>

              <div className="ct__steppers">
                <div className="ct__stepper">
                  <b>Total SKUs to be counted</b>
                  <span>
                    <button type="button" aria-label="Fewer SKUs" disabled={totalSkus <= 1} onClick={() => (setTotalSkus(totalSkus - 1), setBatchCount(Math.min(batchCount, totalSkus - 1)))}>
                      {I.minus}
                    </button>
                    <em>{totalSkus}</em>
                    <button type="button" aria-label="More SKUs" disabled={totalSkus >= 3} onClick={() => setTotalSkus(totalSkus + 1)}>
                      {I.plus}
                    </button>
                  </span>
                </div>
                <div className="ct__stepper">
                  <b>Number of Batches</b>
                  <span>
                    <button type="button" aria-label="Fewer batches" disabled={batchCount <= 1} onClick={() => setBatchCount(batchCount - 1)}>
                      {I.minus}
                    </button>
                    <em>{batches.length}</em>
                    <button type="button" aria-label="More batches" disabled={batchCount >= products.length} onClick={() => setBatchCount(batchCount + 1)}>
                      {I.plus}
                    </button>
                  </span>
                </div>
              </div>

              <div className="ct__totals">
                <div>
                  <span>
                    {I.bottle} Total SKUs
                  </span>
                  <b>{products.length}</b>
                </div>
                <div>
                  <span>
                    {I.layers} Total Units
                  </span>
                  <b>{sum(allRows)}</b>
                </div>
              </div>

              <label className="ct__all">
                <input type="checkbox" checked={selectedCount === batches.length} onChange={(e) => setChecked(Object.fromEntries(batches.map((_, i) => [i, e.target.checked])))} />
                <span className="ct__box">{I.check}</span>
                <b>Select all batches</b>
              </label>

              {batches.map((b, i) => {
                const rows = b.flatMap(rowsFor);
                const open = expanded === i;
                return (
                  <section key={i} className="ct__batch">
                    <div className="ct__batch-head">
                      <label>
                        <input type="checkbox" checked={selected[i]} onChange={(e) => setChecked({ ...checked, [i]: e.target.checked })} aria-label={`Batch ${i + 1}`} />
                        <span className="ct__box">{I.check}</span>
                        <span className="ct__pill">BATCH {i + 1}</span>
                      </label>
                      <span className="ct__counts">
                        <span>
                          {I.bottle}
                          <b>{b.length}</b>
                        </span>
                        <span>
                          {I.layers}
                          <b>{sum(rows)}</b>
                        </span>
                      </span>
                      <button type="button" className="ct__exp" aria-expanded={open} aria-label={`Expand batch ${i + 1}`} onClick={() => setExpanded(open ? null : i)}>
                        {open ? I.caretUp : I.down}
                      </button>
                    </div>
                    {open && (
                      <div className="ct__table">
                        <div className="ct__tr ct__tr--head">
                          <span>SKUS</span>
                          <span>EXP. DATE</span>
                          <span>STOCK ON HAND</span>
                        </div>
                        {rows.map((r, k) => {
                          const p = PRODUCTS[r.product];
                          return (
                            <div key={k} className="ct__tr">
                              <span className="ct__sku">
                                <img src={p.image} alt="" />
                                <span>
                                  <span>{p.name}</span>
                                  <small>
                                    <b>Category: Food/Drink</b> - SKU: {p.sku}
                                  </small>
                                  <small>
                                    <b>Location:</b> {r.loc}
                                  </small>
                                </span>
                              </span>
                              <b>{r.date}</b>
                              <b>{r.stock}</b>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              })}
              <div className="ct__create">
                <button type="button" disabled={selectedCount === 0} onClick={create}>
                  Create
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
