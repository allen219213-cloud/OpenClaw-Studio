import { useCallback, useEffect, useMemo, useState } from "react";

import {
  exportWorkflowResult,
  getWorkflowRun,
  listWorkflows,
  workflowAction
} from "@/services/api";
import { useAppStore } from "@/store/useAppStore";
import type { Workflow, WorkflowRunState } from "@/types/status";

const emptyRun: WorkflowRunState = {
  status: "idle",
  progress: 0,
  logs: [],
  conversation: [],
  result: "",
  updated_at: ""
};

export function TaskExecutionPage(): JSX.Element {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [run, setRun] = useState<WorkflowRunState>(emptyRun);
  const [logFilter, setLogFilter] = useState("");
  const [pausedLog, setPausedLog] = useState(false);
  const [busy, setBusy] = useState(false);
  const setNotice = useAppStore((state) => state.setNotice);

  const selectedWorkflow = useMemo(
    () => workflows.find((item) => item.id === selectedId),
    [selectedId, workflows]
  );

  const visibleLogs = useMemo(() => {
    const logs = run.logs || [];
    if (!logFilter.trim()) return logs;
    const q = logFilter.toLowerCase();
    return logs.filter((item) => item.message.toLowerCase().includes(q) || item.level.toLowerCase().includes(q));
  }, [logFilter, run.logs]);

  const loadWorkflows = useCallback(async (): Promise<void> => {
    try {
      const items = await listWorkflows(query, category);
      setWorkflows(items);
      if (!selectedId && items.length > 0) setSelectedId(items[0].id);
    } catch {
      setNotice("任务列表加载失败");
    }
  }, [category, query, selectedId, setNotice]);

  const loadRun = useCallback(async (): Promise<void> => {
    if (!selectedId) return;
    try {
      const state = await getWorkflowRun(selectedId);
      if (!pausedLog) setRun(state);
    } catch {
      setNotice("执行状态加载失败");
    }
  }, [pausedLog, selectedId, setNotice]);

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  useEffect(() => {
    loadRun();
    const timer = window.setInterval(loadRun, 1200);
    return () => window.clearInterval(timer);
  }, [loadRun]);

  useEffect(() => {
    if (!selectedId) return;
    const urlBase = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
    const wsUrl = urlBase.replace("http", "ws");
    const socket = new WebSocket(`${wsUrl}/ws/workflows/${selectedId}/logs`);
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as WorkflowRunState["logs"][number];
        if (!pausedLog) {
          setRun((prev) => ({ ...prev, logs: [...prev.logs, payload].slice(-500) }));
        }
      } catch {
        setNotice("日志解析失败");
      }
    };
    socket.onopen = () => socket.send("subscribe");
    return () => socket.close();
  }, [pausedLog, selectedId, setNotice]);

  async function act(action: "start" | "pause" | "resume" | "stop" | "retry"): Promise<void> {
    if (!selectedId) return;
    setBusy(true);
    try {
      const res = await workflowAction(selectedId, action);
      setNotice(res.message);
      await loadRun();
    } catch {
      setNotice("操作失败，请稍后重试");
    } finally {
      setBusy(false);
    }
  }

  async function exportResult(format: "markdown" | "html" | "pdf"): Promise<void> {
    if (!selectedId) return;
    setBusy(true);
    try {
      const res = await exportWorkflowResult(selectedId, format);
      setNotice(`${res.message} 路径: ${res.path}`);
    } catch {
      setNotice("结果导出失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4">
      <section className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
        <h3 className="text-lg font-semibold">任务执行页面</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <input
            className="rounded border border-slate-700 bg-slate-950 p-2 text-sm"
            placeholder="搜索任务"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <input
            className="rounded border border-slate-700 bg-slate-950 p-2 text-sm"
            placeholder="分类过滤"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <button className="rounded bg-sky-400 px-3 py-2 text-sm text-slate-950" onClick={loadWorkflows}>
            刷新
          </button>
        </div>

        <div className="mt-3 max-h-52 space-y-2 overflow-y-auto">
          {workflows.map((item) => (
            <article
              key={item.id}
              className={`cursor-pointer rounded p-2 text-sm ${selectedId === item.id ? "bg-sky-900/50" : "bg-slate-950"}`}
              onClick={() => setSelectedId(item.id)}
            >
              <p>{item.name}</p>
              <p className="text-xs text-slate-400">{item.category}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
          <h3 className="text-lg font-semibold">任务详情</h3>
          {selectedWorkflow ? (
            <div className="mt-2 text-sm">
              <p>名称: {selectedWorkflow.name}</p>
              <p>状态: {run.status}</p>
              <p>节点数: {selectedWorkflow.graph.nodes.length}</p>
              <div className="mt-2 h-3 w-full overflow-hidden rounded bg-slate-800">
                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${run.progress}%` }} />
              </div>
              <p className="mt-1 text-xs text-slate-400">进度 {run.progress}%</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="rounded bg-emerald-600 px-3 py-1 text-xs" onClick={() => act("start")} disabled={busy}>
                  启动
                </button>
                <button className="rounded bg-amber-600 px-3 py-1 text-xs" onClick={() => act("pause")} disabled={busy}>
                  暂停
                </button>
                <button className="rounded bg-sky-600 px-3 py-1 text-xs" onClick={() => act("resume")} disabled={busy}>
                  继续
                </button>
                <button className="rounded bg-rose-600 px-3 py-1 text-xs" onClick={() => act("stop")} disabled={busy}>
                  停止
                </button>
                <button className="rounded bg-violet-600 px-3 py-1 text-xs" onClick={() => act("retry")} disabled={busy}>
                  重试
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-400">请选择任务</p>
          )}
        </article>

        <article className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
          <h3 className="text-lg font-semibold">结果导出</h3>
          <div className="mt-3 flex gap-2">
            <button className="rounded bg-slate-700 px-3 py-1 text-xs" onClick={() => exportResult("markdown")}>
              导出 Markdown
            </button>
            <button className="rounded bg-slate-700 px-3 py-1 text-xs" onClick={() => exportResult("html")}>
              导出 HTML
            </button>
            <button className="rounded bg-slate-700 px-3 py-1 text-xs" onClick={() => exportResult("pdf")}>
              导出 PDF
            </button>
          </div>
          <pre className="mt-3 max-h-40 overflow-auto rounded bg-slate-950 p-2 text-xs">{run.result || "暂无结果"}</pre>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-lg font-semibold">实时日志面板</h3>
            <button className="rounded bg-slate-700 px-2 py-1 text-xs" onClick={() => setPausedLog((v) => !v)}>
              {pausedLog ? "继续日志" : "暂停日志"}
            </button>
          </div>
          <input
            className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-xs"
            placeholder="搜索日志"
            value={logFilter}
            onChange={(e) => setLogFilter(e.target.value)}
          />
          <div className="mt-2 max-h-72 space-y-1 overflow-y-auto rounded bg-slate-950 p-2 text-xs">
            {visibleLogs.map((item, index) => (
              <p
                key={`${item.at}-${index}`}
                className={
                  item.level === "error" ? "text-rose-300" : item.level === "success" ? "text-emerald-300" : "text-sky-300"
                }
              >
                [{item.at}] {item.message}
              </p>
            ))}
          </div>
        </article>

        <article className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
          <h3 className="text-lg font-semibold">智能体对话面板</h3>
          <div className="mt-2 max-h-80 space-y-2 overflow-y-auto rounded bg-slate-950 p-2 text-xs">
            {run.conversation.length === 0 ? (
              <p className="text-slate-400">暂无智能体对话</p>
            ) : (
              run.conversation.map((item, index) => (
                <article key={`${item.at}-${index}`} className="rounded border border-slate-800 p-2">
                  <p className="text-emerald-300">{item.agent}</p>
                  <p className="text-slate-200">{item.thought}</p>
                </article>
              ))
            )}
          </div>
        </article>
      </section>
    </section>
  );
}

