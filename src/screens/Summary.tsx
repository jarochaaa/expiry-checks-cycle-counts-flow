import type { Dispatch } from 'react';
import { TASK_DATE_DONE } from '../data';
import type { Action } from '../state';
import { icons } from '../components/icons';
import { Chips, Header, TaskCardInfo } from '../components/ui';
import { useI18n } from '../i18n';

export function Summary({ taskId, skus, alerts, dispatch }: { taskId: string; skus: number; alerts: number; dispatch: Dispatch<Action> }) {
  const { t } = useI18n();
  return (
    <div className="screen screen-enter">
      <Header title={t('greatWork')} onBack={() => dispatch({ type: 'reset' })} />
      <div className="summary">
        <p className="summary__title">{t('completedCount')}</p>
        <img className="summary__tick" src={icons.tick} alt="" />
        <div className="summary__spacer" />
        <div className="task-card task-card--plain" style={{ gap: 12 }}>
          <TaskCardInfo id={taskId} date={TASK_DATE_DONE} />
          <Chips skus={skus} alerts={alerts} />
        </div>
        <div className="summary__cta">
          <button type="button" className="btn btn--primary" style={{ width: '100%' }} onClick={() => dispatch({ type: 'reset' })}>
            {t('gotIt')}
          </button>
        </div>
      </div>
    </div>
  );
}
