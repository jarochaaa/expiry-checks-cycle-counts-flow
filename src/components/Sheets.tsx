import type { Dispatch } from 'react';
import { TASK_DATE } from '../data';
import type { Action } from '../state';
import { icons } from './icons';
import { Chips, TaskCardInfo } from './ui';

/** "Do you want to start this task?" bottom sheet on the Audits list. */
export function StartSheet({ taskId, dispatch }: { taskId: string; dispatch: Dispatch<Action> }) {
  return (
    <div className="p-overlay pl" onClick={() => dispatch({ type: 'closeSheet' })}>
      <div className="p-sheet" role="dialog" aria-label="Start task" onClick={(e) => e.stopPropagation()}>
        <img className="p-sheet__illustration" src={icons.startIllustration} alt="" />
        <p className="p-sheet__title">Do you want to start this task?</p>
        <button type="button" className="p-sheet__close" aria-label="Close" onClick={() => dispatch({ type: 'closeSheet' })}>
          <img src={icons.xWhite} alt="" />
        </button>
        <div className="ticket" style={{ width: '100%' }}>
          <div className="ticket__line">
            <span className="ticket__id">{taskId}</span>
            <span className="ticket__date">25/09/2024 – 13:07</span>
          </div>
        </div>
        <button type="button" className="p-btn" onClick={() => dispatch({ type: 'start' })}>
          Start
        </button>
      </div>
    </div>
  );
}

/** "You are about to send the following inventory count" sheet. */
export function SendSheet({ taskId, skus, alerts, dispatch }: { taskId: string; skus: number; alerts: number; dispatch: Dispatch<Action> }) {
  return (
    <div className="overlay overlay--sheet">
      <div className="sheet" role="dialog" aria-label="Send inventory count">
        <p className="sheet__prompt sheet__prompt--large">
          You are about to send the following
          <br />
          inventory count:
        </p>
        <button type="button" className="sheet__close" aria-label="Close" onClick={() => dispatch({ type: 'closeSheet' })}>
          <img src={icons.arrowDown} alt="" />
        </button>
        <div className="task-card task-card--plain task-card--shadow">
          <TaskCardInfo id={taskId} date={TASK_DATE} />
          <Chips skus={skus} alerts={alerts} />
        </div>
        <div className="sheet__actions" style={{ justifyContent: 'center' }}>
          <button type="button" className="btn btn--mint" style={{ flex: 'none', width: 125, height: 34 }} onClick={() => dispatch({ type: 'send' })}>
            <span className="btn__label">
              <img src={icons.checkCircle} alt="" />
              Send
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
