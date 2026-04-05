import { useState } from "react";

import { startInitialization } from "@/services/api";
import { useAppStore } from "@/store/useAppStore";
import type { InitStatus } from "@/types/status";

interface InitProgressProps {
  status: InitStatus;
  onRefresh: () => void;
}

export function InitProgress({ status, onRefresh }: InitProgressProps): JSX.Element {
  const [loading, setLoading] = useState(false);
  const setNotice = useAppStore((state) => state.setNotice);

  async function start(): Promise<void> {
    setLoading(true);
    try {
      const res = await startInitialization();
      setNotice(res.message);
      onRefresh();
    } catch {
      setNotice("初始化启动失败，请检查设置后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-semibold">系统初始化</h3>
        <button
          type="button"
          disabled={status.in_progress || loading}
          className="rounded bg-sky-400 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
          onClick={start}
        >
          {status.in_progress ? "进行中" : "开始初始化"}
        </button>
      </div>
      <p className="text-sm text-slate-300">{status.message}</p>
      <div className="mt-3 h-3 w-full overflow-hidden rounded bg-slate-800">
        <div className="h-full bg-sky-500 transition-all" style={{ width: `${status.progress}%` }} />
      </div>
      <p className="mt-2 text-xs text-slate-400">进度：{status.progress}%</p>
    </section>
  );
}
