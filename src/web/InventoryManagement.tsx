import { useState } from 'react';
import { PRODUCTS } from '../data';
import carrot from '../assets/web/carrot.svg';
import { CreateTask, STOCK_ROWS } from './CreateTask';
import type { CreatedTask } from './CreateTask';

const KPIS = [
  { label: 'Count Task Completed', value: '450', icon: 'bottle' },
  { label: 'Total SKUs Counted', value: '3.850', icon: 'layers' },
  { label: 'Share of Assortment', value: '12%', icon: 'grid' },
  { label: 'SKUs Defect Rate', value: '40%', icon: 'archive' },
  { label: 'Unit Defect Rate', value: '80%', icon: 'archive' },
] as const;

const EXPIRY_KPIS = [
  { label: 'Expiry Audit completed', value: '450', icon: 'bottle' },
  { label: 'Total SKUs Checked', value: '3.850', icon: 'layers' },
  { label: 'Total Units Checked', value: '3.850', icon: 'layers' },
  { label: 'SKUs Defect Rate', value: '40%', icon: 'grid' },
  { label: 'Unit Defect Rate', value: '80%', icon: 'archive' },
] as const;

const ROWS = [
  { id: '59112207', name: 'Annual Count Task - Store 556683', sample: 'Full Store' },
  { id: '59112207', name: 'Full store count - Quarter 1 - Store 9995', sample: 'Partial Locations' },
  { id: '59112207', name: 'Annual Count Task - Store 123', sample: 'Full Store' },
  { id: '59112207', name: 'Annual Count Task - Store 556683', sample: 'Full Store' },
  { id: '59112207', name: 'Full store count - Quarter 1 - Store 9995', sample: 'Full Store' },
];

const Svg = ({ children, size = 14 }: { children: React.ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {children}
  </svg>
);

const Icon = {
  home: <Svg><path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10" /></Svg>,
  refresh: <Svg><path d="M20 11a8 8 0 0 0-14-4M4 4v4h4M4 13a8 8 0 0 0 14 4M20 20v-4h-4" /></Svg>,
  globe: <Svg><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></Svg>,
  pin: <Svg><path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></Svg>,
  search: <Svg size={14}><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></Svg>,
  down: <Svg size={14}><path d="M12 4v16M6 14l6 6 6-6" /></Svg>,
  chevron: <Svg size={14}><path d="M6 9l6 6 6-6" /></Svg>,
  filter: <Svg size={18}><path d="M3 4h18l-7 9v6l-4 2v-8L3 4z" /></Svg>,
  bottle: <Svg><path d="M10 3h4v4l2 3v11H8V10l2-3V3z" /></Svg>,
  layers: <Svg><path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5" /></Svg>,
  grid: <Svg><rect x="4" y="4" width="7" height="7" /><rect x="13" y="4" width="7" height="7" /><rect x="4" y="13" width="7" height="7" /><rect x="13" y="13" width="7" height="7" /></Svg>,
  archive: <Svg><rect x="3" y="4" width="18" height="5" /><path d="M5 9v11h14V9M10 13h4" /></Svg>,
};

export function InventoryManagement({ created, onCreateTasks }: { created: CreatedTask[]; onCreateTasks: (tasks: CreatedTask[]) => void }) {
  const [creating, setCreating] = useState(false);
  const [sent, setSent] = useState<number | null>(null);
  const [tab, setTab] = useState<'regular' | 'wall' | 'expiry'>('regular');
  const [open, setOpen] = useState<number | null>(null);
  const [openTask, setOpenTask] = useState<string | null>(null);
  return (
    <div className="im" lang="en" dir="ltr">
      <header className="im__header">
        <div className="im__brand">
          <img src={carrot} alt="" width={24} height={24} />
          <h1>Cycle Count History</h1>
        </div>
        <label className="im__search">
          <input type="text" placeholder="Search by Cycle Count ID, Batch ID, SKU" aria-label="Search" />
          <span className="im__search-icon">{Icon.search}</span>
        </label>
        <div className="im__vendor" role="button" tabIndex={0} aria-label="Vendor">
          <b>Darkstores QA Vendor 001</b>
          <span className="im__down">{Icon.down}</span>
        </div>
        <button type="button" className="im__create" onClick={() => setCreating(true)}>
          Create Count Task
        </button>
      </header>

      <div className="im__body">
        <nav className="im__nav" aria-hidden>
          <div className="im__nav-pill">
            <span>{Icon.home}</span>
            <span className="im__nav--on">{Icon.refresh}</span>
            <span>{Icon.globe}</span>
            <span>{Icon.pin}</span>
          </div>
        </nav>

        <main className="im__main">
          <div className="im__kpis">
            {(tab === 'expiry' ? EXPIRY_KPIS : KPIS).map((k) => (
              <div key={k.label} className="im__kpi">
                <span className="im__kpi-icon">{Icon[k.icon]}</span>
                <span className="im__kpi-label">{k.label}</span>
                <em>Monthly</em>
                <b>{k.value}</b>
              </div>
            ))}
          </div>

          <div className="im__tabs" role="tablist">
            <button type="button" role="tab" aria-selected={tab === 'regular'} onClick={() => setTab('regular')}>
              Regular Counts
            </button>
            <button type="button" role="tab" aria-selected={tab === 'wall'} onClick={() => setTab('wall')}>
              Wall to Wall Counts
            </button>
            <button type="button" role="tab" aria-selected={tab === 'expiry'} onClick={() => setTab('expiry')}>
              Expiry Tasks
            </button>
          </div>

          <div className="im__filter">
            <span>
              {Icon.filter}
              <b>Filter</b>
            </span>
            <span className="im__filter-btn">{Icon.down}</span>
          </div>

          {tab === 'expiry' ? (
            <section className="im__table">
              <div className="im__row im__row--exp im__row--head">
                <span>AUDIT ID</span>
                <span>SAMPLE TYPE</span>
                <span>STATUS</span>
                <span>SKUS</span>
                <span>LAST UPDATE</span>
                <span />
              </div>
              {created.map((t) => {
                const isOpen = openTask === t.id;
                const [d, tm] = t.date.split(' – ');
                const rows = t.products.flatMap(STOCK_ROWS);
                return (
                  <div key={t.id} className={isOpen ? 'im__task im__task--open' : 'im__task'}>
                    <div className="im__row im__row--exp">
                      <span>{t.id}</span>
                      <span>Expiry Date Checks</span>
                      <span className="im__status">
                        <b>Unassigned</b>
                        <i />
                        <i />
                        <i />
                      </span>
                      <span>{t.skus} SKUs</span>
                      <span>
                        {d.replace(/\//g, '.')}
                        <br />
                        {tm}
                      </span>
                      <button type="button" className={isOpen ? 'im__expand im__expand--open' : 'im__expand'} aria-label={`Expand task ${t.id}`} aria-expanded={isOpen} onClick={() => setOpenTask(isOpen ? null : t.id)}>
                        {Icon.chevron}
                      </button>
                    </div>
                    {isOpen && (
                      <div className="im__detail">
                        <div className="im__detail-top">
                          <div className="im__mini">
                            <span>Total SKUs</span>
                            <b>{t.skus}</b>
                          </div>
                          <div className="im__mini">
                            <span>Total Units</span>
                            <b>{rows.reduce((n, r) => n + r.stock, 0)}</b>
                          </div>
                          <div className="im__mini">
                            <span>Discrepancies</span>
                            <b>0</b>
                          </div>
                          <h4>Picker: Unassigned</h4>
                        </div>
                        <div className="im__actions">
                          <b>Actions:</b>
                          <button type="button" className="im__act">
                            Download
                          </button>
                          <button type="button" className="im__act im__act--go" disabled>
                            Adjust and complete
                          </button>
                        </div>
                        <div className="im__filter im__filter--inner">
                          <span>
                            {Icon.filter}
                            <b>Filter</b>
                          </span>
                          <span className="im__filter-btn">{Icon.down}</span>
                        </div>
                        <div className="im__sku-table">
                          <div className="im__sku im__sku--head">
                            <span>IMAGE</span>
                            <span>SKU</span>
                            <span>LOCATION</span>
                            <span>EXPIRY DATE</span>
                            <span>STOCK ON HAND</span>
                            <span>COUNTED/ REMOVED</span>
                            <span>TASK</span>
                            <span>DATE</span>
                            <span>ADJUSTMENT</span>
                          </div>
                          {t.products.map((p) => {
                            const pr = PRODUCTS[p];
                            const rs = STOCK_ROWS(p);
                            return (
                              <div key={p} className="im__sku im__sku--card">
                                <span className="im__sku-img">
                                  <img src={pr.image} alt="" />
                                </span>
                                <span className="im__sku-name">
                                  {pr.name}
                                  <small>
                                    <b>Barcode:</b> {pr.barcode}
                                  </small>
                                  <small>
                                    <b>SKU:</b> {pr.sku}
                                  </small>
                                </span>
                                <span className="im__sku-loc">
                                  <i>{rs[0].loc}</i>
                                </span>
                                <span className="im__sku-lines">
                                  {rs.map((r) => (
                                    <span key={r.date}>{r.date.replace(/\//g, '/')}</span>
                                  ))}
                                </span>
                                <span className="im__sku-lines">
                                  {rs.map((r) => (
                                    <span key={r.date}>{r.stock}</span>
                                  ))}
                                </span>
                                <span className="im__sku-lines">
                                  {rs.map((r) => (
                                    <span key={r.date}>–</span>
                                  ))}
                                </span>
                                <span className="im__sku-lines">
                                  {rs.map((r) => (
                                    <span key={r.date}>Expiry Check</span>
                                  ))}
                                </span>
                                <span className="im__sku-lines im__sku-lines--date">
                                  {rs.map((r) => (
                                    <span key={r.date}>
                                      {d.replace(/\//g, '.')}
                                      <br />
                                      {tm}
                                    </span>
                                  ))}
                                </span>
                                <span className="im__sku-adj">–</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="im__row im__row--exp">
                <span>59112207</span>
                <span>Deshelving</span>
                <span className="im__status">
                  <b>Unassigned</b>
                  <i />
                  <i />
                  <i />
                </span>
                <span>120 SKUs</span>
                <span>
                  20.03.2023
                  <br />
                  14:05:25 AM
                </span>
                <span />
              </div>
              <div className="im__row im__row--exp">
                <span>59112207</span>
                <span>Expiry Date Checks</span>
                <span className="im__status">
                  <b>Unassigned</b>
                  <i />
                  <i />
                  <i />
                </span>
                <span>120 SKUs</span>
                <span>
                  20.03.2023
                  <br />
                  14:05:25 AM
                </span>
                <span />
              </div>
            </section>
          ) : (
          <section className="im__table">
            <div className="im__row im__row--head">
              <span>Wall to wall<br />ID</span>
              <span>Full store count<br />reference name</span>
              <span>status</span>
              <span>SKUs</span>
              <span>Location<br />sample</span>
              <span>locations<br />amount</span>
              <span>Place At</span>
              <span />
            </div>
            {tab !== 'regular' ? (
              ROWS.map((r, i) => (
                <div key={i} className="im__row">
                  <span>{r.id}</span>
                  <span>{r.name}</span>
                  <span className="im__status">
                    <b>Unassigned</b>
                    <i />
                    <i />
                    <i />
                  </span>
                  <span>120 SKUs</span>
                  <span>{r.sample}</span>
                  <span>250</span>
                  <span>
                    20.03.2023
                    <br />
                    14:05:25 AM
                  </span>
                  <button type="button" className={open === i ? 'im__expand im__expand--open' : 'im__expand'} aria-label="Expand row" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
                    {Icon.chevron}
                  </button>
                </div>
              ))
            ) : (
              <p className="im__empty">No regular counts to show.</p>
            )}
          </section>
          )}
        </main>
      </div>

      {creating && (
        <CreateTask
          onClose={() => setCreating(false)}
          onCreate={(tasks) => {
            setCreating(false);
            setTab('expiry');
            setSent(tasks.length);
            onCreateTasks(tasks);
            setTimeout(() => setSent(null), 4000);
          }}
        />
      )}
      {sent != null && (
        <div className="im-toast" role="status">
          {sent} Expiry Level task{sent > 1 ? 's' : ''} sent to Pelican
        </div>
      )}
    </div>
  );
}
