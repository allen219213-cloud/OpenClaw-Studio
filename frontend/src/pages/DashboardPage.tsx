import { useCallback, useEffect, useState } from "react";

import { InitProgress } from "@/components/InitProgress";
import { ServiceControls } from "@/components/ServiceControls";
import { StatCard } from "@/components/StatCard";
import { TaskList } from "@/components/TaskList";
import { getInitializationStatus, getOverview } from "@/services/api";
import { useAppStore } from "@/store/useAppStore";
import type { DashboardPayload, InitStatus } from "@/types/status";

const emptyOverview: DashboardPayload = {
  metrics: { cpu_percent: 0, memory_percent: 0, disk_percent: 0 },
  service: { name: "openclaw", status: "stopped", pid: null, updated_at: "" },
  task_stats: { total: 0, running: 0, completed: 0, failed: 0 },
  recent_tasks: []
};

const emptyInit: InitStatus = {
  in_progress: false,
  progress: 0,
  current_step: "idle",
  message: "尚未开始",
  started_at: null,
  finished_at: null
};

export function DashboardPage(): JSX.Element {
  const [overview, setOverview] = useState<DashboardPayload>(emptyOverview);
  const [initStatus, setInitStatus] = useState<InitStatus>(emptyInit);
  const setNotice = useAppStore((state) => state.setNotice);

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const [summary, init] = await Promise.all([getOverview(), getInitializationStatus()]);
      setOverview(summary);
      setInitStatus(init);
    } catch {
      setNotice("仪表盘数据加载失败，请稍后重试");
    }
  }, [setNotice]);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="CPU 使用率" value={`${overview.metrics.cpu_percent}%`} />
        <StatCard title="内存使用率" value={`${overview.metrics.memory_percent}%`} />
        <StatCard title="磁盘使用率" value={`${overview.metrics.disk_percent}%`} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="总任务数" value={`${overview.task_stats.total}`} />
        <StatCard title="运行中" value={`${overview.task_stats.running}`} />
        <StatCard title="已完成" value={`${overview.task_stats.completed}`} />
        <StatCard title="失败" value={`${overview.task_stats.failed}`} />
      </div>

      <section className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
        <h3 className="text-lg font-semibold">OpenClaw 服务状态</h3>
        <p className="mt-2 text-sm text-slate-300">状态：{overview.service.status}</p>
        <p className="text-sm text-slate-400">PID：{overview.service.pid ?? "-"}</p>
      </section>

      <ServiceControls onDone={refresh} />
      <InitProgress status={initStatus} onRefresh={refresh} />
      <TaskList tasks={overview.recent_tasks} />
    </section>
  );
}
