import { useState } from "react";

import { serviceAction } from "@/services/api";
import { useAppStore } from "@/store/useAppStore";

interface ServiceControlsProps {
  onDone: () => void;
}

export function ServiceControls({ onDone }: ServiceControlsProps): JSX.Element {
  const [loading, setLoading] = useState(false);
  const setNotice = useAppStore((state) => state.setNotice);

  async function handleAction(action: "start" | "stop" | "restart"): Promise<void> {
    setLoading(true);
    try {
      const res = await serviceAction(action);
      setNotice(res.message);
      onDone();
    } catch {
      setNotice("操作失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
      <h3 className="mb-3 text-lg font-semibold">OpenClaw 服务控制</h3>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading}
          className="rounded bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 disabled:opacity-60"
          onClick={() => handleAction("start")}
        >
          启动
        </button>
        <button
          type="button"
          disabled={loading}
          className="rounded bg-rose-500 px-3 py-2 text-sm font-medium text-slate-950 disabled:opacity-60"
          onClick={() => handleAction("stop")}
        >
          停止
        </button>
        <button
          type="button"
          disabled={loading}
          className="rounded bg-amber-400 px-3 py-2 text-sm font-medium text-slate-950 disabled:opacity-60"
          onClick={() => handleAction("restart")}
        >
          重启
        </button>
      </div>
    </section>
  );
}
