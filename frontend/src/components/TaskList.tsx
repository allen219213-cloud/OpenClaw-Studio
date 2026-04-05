import type { TaskInfo } from "@/types/status";

interface TaskListProps {
  tasks: TaskInfo[];
}

const statusColor: Record<TaskInfo["status"], string> = {
  running: "text-amber-300",
  completed: "text-emerald-300",
  failed: "text-rose-300"
};

export function TaskList({ tasks }: TaskListProps): JSX.Element {
  return (
    <section className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
      <h3 className="mb-3 text-lg font-semibold">最近任务</h3>
      {tasks.length === 0 ? (
        <p className="text-sm text-slate-400">暂无任务记录</p>
      ) : (
        <div className="space-y-2 text-sm">
          {tasks.map((task) => (
            <article key={task.id} className="rounded bg-slate-950 p-2">
              <p className={statusColor[task.status]}>{task.status.toUpperCase()}</p>
              <p className="text-slate-100">{task.name}</p>
              <p className="text-slate-400">{task.message}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
