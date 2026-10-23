import { useEffect, useReducer } from 'react';
import { DetailModal } from './components/DetailModal';
import { SendSheet, StartSheet } from './components/Sheets';
import { TesterNotes } from './components/TesterNotes';
import { TaskBanner } from './components/TaskBanner';
import { Toast } from './components/ui';
import { LOC_BY_ID, PRODUCTS } from './data';
import { SkuList } from './screens/SkuList';
import { Summary } from './screens/Summary';
import { Audits } from './screens/Audits';
import { PdpScreen } from './screens/Pdp';
import { PRESETS, codeFor, initialState, reducer } from './state';
import { taskFor } from './tasks';

const SKUS = Object.keys(PRODUCTS).length;
const SEND_MS = 1400;

export default function App() {
  const [s, dispatch] = useReducer(reducer, initialState);

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

  return (
    <div className="stage">
      <nav className="proto-nav" aria-label="Prototype flow">
        <div className="proto-nav__title">Cycle Count · flow</div>
        {PRESETS.map((p, i) => (
          <div key={p.id} style={{ display: 'contents' }}>
            {(i === 0 || PRESETS[i - 1].group !== p.group) && <div className="proto-nav__sub">{p.group}</div>}
            <button type="button" onClick={() => dispatch({ type: 'jump', preset: p.id })}>
              <b className="proto-nav__code">{p.code}</b>
              {p.label}
            </button>
          </div>
        ))}
      </nav>

      <TesterNotes s={s} code={codeFor(s)} />

      <div className="view-tag" aria-hidden>
        View <b>{codeFor(s) ?? '·'}</b>
      </div>

      <div className="app">
        <TaskBanner task={taskFor(s)} code={codeFor(s)} />

        <div className="app__view">
          {s.screen === 'audits' && <Audits tab={s.auditsTab} dispatch={dispatch} />}
          {s.screen === 'skus' && <SkuList s={s} dispatch={dispatch} />}
          {s.screen === 'summary' && <Summary taskId={s.taskId} skus={SKUS} alerts={s.discrepancies} dispatch={dispatch} />}

          {s.sheet === 'start' && <StartSheet taskId={s.taskId} dispatch={dispatch} />}
          {s.sheet === 'send' && <SendSheet taskId={s.taskId} skus={SKUS} alerts={s.discrepancies} dispatch={dispatch} />}
          {s.pdp && <PdpScreen pdp={s.pdp} recount={s.recount[LOC_BY_ID[s.pdp.loc].product]} hintClosed={s.hintClosed} dispatch={dispatch} />}
          {s.detail && <DetailModal product={s.detail} dispatch={dispatch} />}
          {s.sending && (
            <div className="spinner-wrap" role="status" aria-label="Sending">
              <div className="spinner" />
            </div>
          )}

          {s.alert && (
            <Toast key={s.alert.id} onClick={() => dispatch({ type: 'alert', text: null })}>
              {s.alert.text}
            </Toast>
          )}
        </div>
      </div>
    </div>
  );
}
