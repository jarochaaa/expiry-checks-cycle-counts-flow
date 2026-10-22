import type { Dispatch } from 'react';
import { TASK_DATE_DONE, TASK_ID } from '../data';
import type { Action } from '../state';
import { icons } from '../components/icons';
import { Chips, Header, TaskCardInfo } from '../components/ui';

export function Summary({ skus, alerts, dispatch }: { skus: number; alerts: number; dispatch: Dispatch<Action> }) {
  return (
    <div className="screen screen-enter">
      <Header title="Great work!" onBack={() => dispatch({ type: 'reset' })} />
      <div className="summary">
        <p className="summary__title">You have completed this Cycle Count!</p>
        <img className="summary__tick" src={icons.tick} alt="" />
        <div className="summary__spacer" />
        <div className="task-card task-card--plain" style={{ gap: 12 }}>
          <TaskCardInfo id={TASK_ID} date={TASK_DATE_DONE} />
          <Chips skus={skus} alerts={alerts} />
        </div>
        <div className="summary__cta">
          <button type="button" className="btn btn--primary" style={{ width: '100%' }} onClick={() => dispatch({ type: 'reset' })}>
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
