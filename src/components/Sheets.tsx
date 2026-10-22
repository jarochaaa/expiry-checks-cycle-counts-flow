import type { Dispatch } from 'react';
import { TASK_DATE, TASK_ID } from '../data';
import type { Action } from '../state';
import { icons } from './icons';
import { Chips, TaskCardInfo } from './ui';

/** "Assign to me?" bottom sheet on the task list. */
export function AssignSheet({ dispatch }: { dispatch: Dispatch<Action> }) {
  return (
    <div className="overlay overlay--sheet">
      <div className="sheet" role="dialog" aria-label="Assign to me?">
        <div className="task-card task-card--plain">
          <TaskCardInfo id={TASK_ID} date={TASK_DATE} />
        </div>
        <p className="sheet__prompt">Assign to me?</p>
        <div className="sheet__actions">
          <button type="button" className="btn btn--outline-red" onClick={() => dispatch({ type: 'closeSheet' })}>
            <img src={icons.removeCircle} alt="" />
            Won’t do
          </button>
          <button type="button" className="btn btn--mint" onClick={() => dispatch({ type: 'start' })}>
            <span className="btn__label">
              <img src={icons.checkCircle} alt="" />
              Start
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

/** "You are about to send the following inventory count" sheet. */
export function SendSheet({ skus, alerts, dispatch }: { skus: number; alerts: number; dispatch: Dispatch<Action> }) {
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
          <TaskCardInfo id={TASK_ID} date={TASK_DATE} />
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
