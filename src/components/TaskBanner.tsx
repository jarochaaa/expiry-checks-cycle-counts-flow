import type { Task } from '../tasks';

/** Orange "Tasks" strip on top of every view. */
/** `code` is a review aid (view + use case, e.g. B3); pass null to hide it. */
export function TaskBanner({ task, code }: { task: Task; code?: string | null }) {
  return (
    <aside className="task-banner" aria-label="Test task">
      {task.n != null && <span className="task-banner__num" aria-hidden>{task.n}</span>}
      <div className="task-banner__text">
        <p className="task-banner__detail">
          {task.title && <strong>{task.title} </strong>}
          {task.detail}
        </p>
        {task.description && <p className="task-banner__desc">{task.description}</p>}
      </div>
      {code !== undefined && <span className="task-banner__code" aria-label={`View ${code ?? 'unmapped'}`}>{code ?? '·'}</span>}
    </aside>
  );
}
