import { useEffect, useReducer, useRef, useState } from 'react';
import { DetailModal } from './components/DetailModal';
import { SendSheet, StartSheet } from './components/Sheets';
import { TesterNotes } from './components/TesterNotes';
import { TaskBanner } from './components/TaskBanner';
import { Toast } from './components/ui';
import { LOCS, LOC_BY_ID } from './data';
import { SkuList } from './screens/SkuList';
import { Summary } from './screens/Summary';
import { Audits } from './screens/Audits';
import { Language } from './screens/Language';
import { InventoryManagement } from './web/InventoryManagement';
import type { TaskResult, WebCommand } from './web/InventoryManagement';
import type { CreatedTask } from './web/CreateTask';
import './web/web.css';
import { I18nProvider, LANGS, makeI18n } from './i18n';
import { PdpScreen } from './screens/Pdp';
import { PRESETS, codeFor, initialState, reducer } from './state';
import { SHOW_TASK_BANNER, taskFor } from './tasks';

const SEND_MS = 1400;

/** Website views reachable from the navigator (codes are derived in InventoryManagement). */
const WEB_VIEWS: { id: WebCommand['id']; group: string; label: string }[] = [
  { id: 'IM1', group: 'Cycle Count History', label: 'Regular Counts' },
  { id: 'IM2', group: 'Cycle Count History', label: 'Wall to Wall Counts' },
  { id: 'IM3', group: 'Create Count Task', label: 'Select the SKUs to be added' },
  { id: 'IM4', group: 'Create Count Task', label: 'Expiry Checks selected' },
  { id: 'IM5', group: 'Create Count Task', label: 'Batches' },
  { id: 'IM6', group: 'Create Count Task', label: 'Batches · 3 batches, one expanded' },
  { id: 'IM7', group: 'Expiry Checks tasks', label: 'Expiry Checks list' },
  { id: 'IM8', group: 'Expiry Checks tasks', label: 'Task expanded · waiting for Pelican' },
  { id: 'IM9', group: 'Expiry Checks tasks', label: 'Task completed in Pelican · discrepancies' },
  { id: 'IM10', group: 'Expiry Checks tasks', label: 'Manual Adjust Batch (pop up)' },
  { id: 'IM11', group: 'Expiry Checks tasks', label: 'Task after the manual adjustment' },
];
/** Edge cases: each one starts with a titled row, followed by the states it goes through (preset ids from state.ts). */
const USE_CASES: { title: string; hint: string; steps: string[] }[] = [
  { title: 'USE CASE 1 · Force an extra batch', hint: 'Add batches → pick a date → type units', steps: ['pdp-hint-closed', 'calendar', 'qty-new-empty', 'pdp-new-batch'] },
  { title: 'USE CASE 2 · Force a recount', hint: 'Type a wrong total, e.g. Sita 6 + 3', steps: ['pdp-hint-closed', 'pdp-entered', 'pdp-discrepancy', 'pdp-recount', 'processed-recount'] },
  { title: 'USE CASE 3 · Out of Stock', hint: 'Slide a card to the left', steps: ['chao2-created', 'chao2-swipe', 'chao-banner', 'chao-swipe2'] },
  { title: 'USE CASE 4 · Errors', hint: 'Cannot be triggered by tapping', steps: ['alert-network', 'alert-wrong', 'alert-complete', 'alert-send'] },
];
const SAMPLE_TASK: CreatedTask = { id: '67893', date: '', skus: 3, products: ['sita', 'burine', 'chao'] };

export default function App() {
  const box = useRef<HTMLDivElement>(null);
  const [navOpen, setNavOpen] = useState(true);
  const [s, dispatch] = useReducer(reducer, initialState);
  // Tasks created in Inventory Management arrive in Pelican's Audits list
  const [created, setCreated] = useState<CreatedTask[]>([]);
  // Counts finished in Pelican flow back to the same task in Inventory Management
  const [results, setResults] = useState<Record<string, TaskResult>>({});
  const [webCmd, setWebCmd] = useState<WebCommand | null>(null);
  const [webCode, setWebCode] = useState('IM1');
  const [open, setOpen] = useState({ im: true, pl: true, uc: true });
  const webRef = useRef<HTMLElement>(null);
  const appRef = useRef<HTMLElement>(null);
  const show = (el: HTMLElement | null) => el?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  const goWeb = (id: WebCommand['id']) => {
    if ((id === 'IM7' || id === 'IM8') && created.length === 0) {
      const d = new Date();
      const p2 = (n: number) => String(n).padStart(2, '0');
      setCreated([{ ...SAMPLE_TASK, date: `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()} – ${p2(d.getHours())}:${p2(d.getMinutes())}` }]);
    }
    if (['IM9', 'IM10', 'IM11'].includes(id)) {
      // these views need Pelican's counts: if the task has none yet, fake a finished run with one discrepancy
      const tk = created[0] ?? { ...SAMPLE_TASK, date: '' };
      const d = new Date();
      const p2 = (n: number) => String(n).padStart(2, '0');
      if (!created[0]) setCreated([{ ...tk, date: `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()} – ${p2(d.getHours())}:${p2(d.getMinutes())}` }]);
      if (!results[tk.id]) {
        const counted: TaskResult['counted'] = {};
        for (const l of LOCS.filter((x) => tk.products.includes(x.product))) counted[l.id] = Object.fromEntries(l.dates.map((dt, i) => [dt.replace(/\./g, '/'), l.pass[i]]));
        const first = LOCS.find((x) => tk.products.includes(x.product))!;
        const k = first.dates[0].replace(/\./g, '/');
        counted[first.id]![k] = Math.max(0, counted[first.id]![k] - 1);
        const products: TaskResult['products'] = {};
        for (const p of tk.products) products[p] = { first: LOCS.filter((l) => l.product === p).reduce((n, l) => n + Object.values(counted[l.id] ?? {}).reduce((x, y) => x + y, 0), 0), recount: null };
        setResults((r) => ({ ...r, [tk.id]: { at: `${p2(d.getDate())}.${p2(d.getMonth() + 1)}.${d.getFullYear()} – ${p2(d.getHours())}:${p2(d.getMinutes())}`, counted, products } }));
      }
    }
    setWebCmd((c) => ({ id, n: (c?.n ?? 0) + 1 }));
    show(webRef.current);
  };

  useEffect(() => {
    if (s.screen !== 'summary' || !created.some((c) => c.id === s.taskId)) return;
    const counted: TaskResult['counted'] = {};
    const products: TaskResult['products'] = {};
    for (const l of LOCS.filter((x) => s.scope.includes(x.product))) {
      const byDate: Record<string, number> = {};
      for (const d of l.dates) byDate[d.replace(/\./g, '/')] = 0;
      if (!s.locs[l.id].oos) for (const b of s.locs[l.id].batches) byDate[b.date.replace(/\./g, '/')] = (byDate[b.date.replace(/\./g, '/')] ?? 0) + b.qty;
      counted[l.id] = byDate;
    }
    for (const p of s.scope) {
      const final = LOCS.filter((l) => l.product === p).reduce((n, l) => n + Object.values(counted[l.id] ?? {}).reduce((x, y) => x + y, 0), 0);
      const first = s.firstCount[p];
      products[p] = first != null ? { first, recount: final } : { first: final, recount: null };
    }
    const now = new Date();
    const p2 = (n: number) => String(n).padStart(2, '0');
    const at = `${p2(now.getDate())}.${p2(now.getMonth() + 1)}.${now.getFullYear()} – ${p2(now.getHours())}:${p2(now.getMinutes())}`;
    setResults((r) => ({ ...r, [s.taskId]: { at, counted, products } }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.screen, s.taskId]);

  // Alerts auto-dismiss; a new alert (new id) restarts the timer.
  useEffect(() => {
    if (!s.alert) return;
    const t = setTimeout(() => dispatch({ type: 'alert', text: null }), 3500);
    return () => clearTimeout(t);
  }, [s.alert]);

  // "Send" shows a spinner, then lands on the summary.
  useEffect(() => {
    if (!s.sending) return;
    const t = setTimeout(() => dispatch({ type: 'sent' }), SEND_MS);
    return () => clearTimeout(t);
  }, [s.sending]);

  const i18n = makeI18n(s.lang);
  return (
    <I18nProvider value={i18n}>
    <div className="stage">
      <nav className="proto-nav" aria-label="Prototype flow" data-open={navOpen}>
        <button type="button" className="proto-nav__title" aria-expanded={navOpen} onClick={() => setNavOpen(!navOpen)}>
          <span className="proto-nav__chev" aria-hidden />
          Cycle Count - Expiry Checks flow
        </button>
        {navOpen && (
          <>

        <button type="button" className="proto-nav__group" aria-expanded={open.im} onClick={() => setOpen({ ...open, im: !open.im })}>
          <span className="proto-nav__chev" aria-hidden />
          Inventory Management
          <em>{WEB_VIEWS.length}</em>
        </button>
        {open.im &&
          WEB_VIEWS.map((v, i) => (
            <div key={v.id} style={{ display: 'contents' }}>
              {(i === 0 || WEB_VIEWS[i - 1].group !== v.group) && <div className="proto-nav__sub">{v.group}</div>}
              <button type="button" className={webCode === v.id ? 'is-on' : undefined} onClick={() => goWeb(v.id)}>
                <b className="proto-nav__code">{v.id}</b>
                {v.label}
              </button>
            </div>
          ))}

            <button type="button" className="proto-nav__group" aria-expanded={open.uc} onClick={() => setOpen({ ...open, uc: !open.uc })}>
              <span className="proto-nav__chev" aria-hidden />
              Edge cases
              <em>{USE_CASES.length}</em>
            </button>
            {open.uc &&
              USE_CASES.map((u) => (
                <div key={u.title} style={{ display: 'contents' }}>
                  <div className="proto-nav__uc">
                    {u.title}
                    <small>{u.hint}</small>
                  </div>
                  {u.steps.map((id) => {
                    const p = PRESETS.find((x) => x.id === id)!;
                    return (
                      <button
                        key={id}
                        type="button"
                        className={codeFor(s) === p.code ? 'is-on' : undefined}
                        onClick={() => dispatch({ type: 'jump', preset: id })}
                      >
                        <b className="proto-nav__code">{p.code}</b>
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              ))}
        <button type="button" className="proto-nav__group" aria-expanded={open.pl} onClick={() => setOpen({ ...open, pl: !open.pl })}>
          <span className="proto-nav__chev" aria-hidden />
          Pelican
          <em>{PRESETS.length}</em>
        </button>
        {open.pl &&
          PRESETS.map((p, i) => (
            <div key={p.id} style={{ display: 'contents' }}>
              {(i === 0 || PRESETS[i - 1].group !== p.group) && <div className="proto-nav__sub">{p.group}</div>}
              <button
                type="button"
                className={codeFor(s) === p.code ? 'is-on' : undefined}
                onClick={() => {
                  dispatch({ type: 'jump', preset: p.id });
                  show(appRef.current);
                }}
              >
                <b className="proto-nav__code">{p.code}</b>
                {p.label}
              </button>
            </div>
          ))}
          </>
        )}
      </nav>

      <div className="board" ref={box} onScroll={(e) => e.currentTarget.scrollLeft > 8 && setNavOpen(false)}>
        <div className="board__fit">
        <section className="board__web" aria-label="Inventory Management" ref={webRef}>
          <header className="board__title">
            <h2>Inventory Management - Creation &amp; Adjustment Flow</h2>
            <div className="board__tags">
              <span className="board__tag">Web</span>
              <span className="board__tag">Back-office</span>
              <span className="board__tag">Desktop</span>
              <span className="board__tag board__tag--view">
                View <b>{webCode}</b>
              </span>
            </div>
          </header>
          <InventoryManagement created={created} results={results} command={webCmd} onCode={setWebCode} onCreateTasks={(t) => setCreated((c) => [...t.map((x, i) => ({ ...x, id: String(67893 + c.length + i) })), ...c])} />
        </section>
        <section className="board__app" aria-label="App" ref={appRef}>
          <header className="board__title">
            <h2>Pelican</h2>
            <div className="board__tags">
              <span className="board__tag">Mobile app</span>
              <span className="board__tag">Picker</span>
              <span className="board__tag">Cycle Counts</span>
            </div>
          </header>
          <div className="board__row">
      <div className={SHOW_TASK_BANNER ? 'app' : 'app app--no-banner'}>
        {SHOW_TASK_BANNER && <TaskBanner task={taskFor(s)} code={codeFor(s)} />}

        <div className="app__view" dir={i18n.rtl ? 'rtl' : 'ltr'} lang={s.lang}>
          {s.screen === 'audits' && <Audits tab={s.auditsTab} created={created} dispatch={dispatch} />}
          {s.screen === 'language' && <Language dispatch={dispatch} />}
          {s.screen === 'skus' && <SkuList s={s} dispatch={dispatch} />}
          {s.screen === 'summary' && <Summary taskId={s.taskId} skus={s.scope.length} alerts={s.discrepancies} dispatch={dispatch} />}

          {s.sheet === 'start' && <StartSheet taskId={s.taskId} dispatch={dispatch} />}
          {s.sheet === 'send' && <SendSheet taskId={s.taskId} skus={s.scope.length} alerts={s.discrepancies} dispatch={dispatch} />}
          {s.pdp && <PdpScreen pdp={s.pdp} recount={s.recount[LOC_BY_ID[s.pdp.loc].product]} hintClosed={s.hintClosed} dispatch={dispatch} />}
          {s.detail && <DetailModal product={s.detail} dispatch={dispatch} />}
          {s.sending && (
            <div className="spinner-wrap" role="status" aria-label="Sending">
              <div className="spinner" />
            </div>
          )}

          {s.alert && (
            <Toast key={s.alert.id} onClick={() => dispatch({ type: 'alert', text: null })}>
              {i18n.t(`alert.${s.alert.text}` as 'alert.error')}
            </Toast>
          )}
        </div>
      </div>
          <div className="side">
            <div className="view-tag" aria-hidden>
              View <b>{codeFor(s) ?? '·'}</b>
            </div>

            <div className="lang-switch" role="group" aria-label="App language">
              <span>App language</span>
              <div className="lang-switch__opts">
                {LANGS.map((l) => (
                  <button key={l.id} type="button" aria-pressed={s.lang === l.id} onClick={() => dispatch({ type: 'setLang', lang: l.id })}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <TesterNotes s={s} code={codeFor(s)} />
          </div>
          </div>
        </section>
        </div>
      </div>
    </div>
    </I18nProvider>
  );
}
