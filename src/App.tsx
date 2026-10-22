import { useEffect, useReducer } from 'react';
import { DetailModal } from './components/DetailModal';
import { ScanModal } from './components/ScanModal';
import { AssignSheet, SendSheet } from './components/Sheets';
import { TaskBanner } from './components/TaskBanner';
import { Toast } from './components/ui';
import { LOC_ORDER } from './data';
import { SkuList } from './screens/SkuList';
import { Summary } from './screens/Summary';
import { TaskList } from './screens/TaskList';
import { PRESETS, initialState, reducer } from './state';
import { taskFor } from './tasks';

const SKUS = LOC_ORDER.length;
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

  const doneCount = LOC_ORDER.filter((id) => s.locs[id].done).length;

  return (
    <div className="stage">
      <nav className="proto-nav" aria-label="Prototype flow">
        <div className="proto-nav__title">Cycle Count · flow</div>
        {PRESETS.map((p, i) => (
          <div key={p.id} style={{ display: 'contents' }}>
            {(i === 0 || PRESETS[i - 1].group !== p.group) && <div className="proto-nav__sub">{p.group}</div>}
            <button type="button" onClick={() => dispatch({ type: 'jump', preset: p.id })}>
              {p.label}
            </button>
          </div>
        ))}
      </nav>

      <div className="app">
        <TaskBanner task={taskFor(s)} />

        <div className="app__view">
          {s.screen === 'tasks' && <TaskList doneCount={doneCount} dispatch={dispatch} />}
          {s.screen === 'skus' && <SkuList s={s} dispatch={dispatch} />}
          {s.screen === 'summary' && <Summary skus={SKUS} alerts={s.discrepancies} dispatch={dispatch} />}

          {s.sheet === 'assign' && <AssignSheet dispatch={dispatch} />}
          {s.sheet === 'send' && <SendSheet skus={SKUS} alerts={s.discrepancies} dispatch={dispatch} />}
          {s.scan && <ScanModal s={s} dispatch={dispatch} />}
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
