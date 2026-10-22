import type { Task } from '../tasks';

/** Orange "Tasks" strip on top of every view. */
export function TaskBanner({ task }: { task: Task }) {
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
    </aside>
  );
}
