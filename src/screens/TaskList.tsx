import type { Dispatch } from 'react';
import { TASK_DATE, TASK_ID } from '../data';
import type { Action } from '../state';
import { icons } from '../components/icons';
import { Header, TaskCardInfo } from '../components/ui';

const TODO = [
  { id: '42679', date: '31/07/2023 -00:47' },
  { id: '42673', date: '31/07/2023 -00:43' },
  { id: '42633', date: '31/07/2023 -00:05' },
];

export function TaskList({ doneCount, dispatch }: { doneCount: number; dispatch: Dispatch<Action> }) {
  return (
    <div className="screen screen-enter">
      <Header title="Cycle Count" actions app />
      <div className="panel" style={{ marginTop: 0 }}>
        <div className="panel__scroll">
          <div className="task-list">
            <p className="task-list__section">In progress</p>
            <article className="task-card task-card--plain" style={{ minHeight: 84 }}>
              <TaskCardInfo id="42696" date="31/07/2023 - 01:05" />
              <div className="task-card__progress">
                <span className="task-card__bar" />
                0 items
              </div>
              <img className="task-card__chevron" src={icons.chevronRight} alt="" />
            </article>
            <button type="button" className="task-card task-card--plain task-card--tap" style={{ minHeight: 84 }} onClick={() => dispatch({ type: 'openTask' })}>
              <TaskCardInfo id={TASK_ID} date={TASK_DATE} />
              <div className="task-card__progress">
                <span className="task-card__bar" />
                {doneCount} {doneCount === 1 ? 'item' : 'items'}
              </div>
              <img className="task-card__chevron" src={icons.chevronRight} alt="" />
            </button>
            <p className="task-list__section" style={{ paddingTop: 18 }}>
              To do
            </p>
            {TODO.map((t) => (
              <article key={t.id} className="task-card task-card--plain" style={{ minHeight: 66 }}>
                <TaskCardInfo id={t.id} date={t.date} />
                <img className="task-card__chevron" src={icons.chevronRight} alt="" />
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
