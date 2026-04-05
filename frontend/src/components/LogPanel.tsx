import type { BackendStatus } from "@/types/status";

const levelColors: Record<BackendStatus["level"], string> = {
  info: "text-sky-400",
  success: "text-emerald-400",
  error: "text-rose-400"
};

interface LogPanelProps {
  logs: BackendStatus[];
}

export function LogPanel({ logs }: LogPanelProps): JSX.Element {
  return (
    <section className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
      <h2 className="mb-3 text-lg font-semibold">实时日志</h2>
      <div className="max-h-[280px] space-y-2 overflow-y-auto text-sm">
        {logs.length === 0 ? (
          <p className="text-slate-400">尚未收到日志</p>
        ) : (
          logs.map((log, index) => (
            <article key={`${log.at}-${index}`} className="rounded bg-slate-950 p-2">
              <p className={levelColors[log.level]}>{log.level.toUpperCase()}</p>
              <p className="text-slate-200">{log.message}</p>
              <p className="text-xs text-slate-500">{log.at}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
