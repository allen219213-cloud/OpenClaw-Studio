import { Suspense, lazy, useState } from "react";
import { Background, Controls, MiniMap, ReactFlow, type Edge, type Node } from "reactflow";
import "reactflow/dist/style.css";

import { LogPanel } from "@/components/LogPanel";
import { useStatusSocket } from "@/hooks/useStatusSocket";
import { useAppStore } from "@/store/useAppStore";

const DashboardPage = lazy(() => import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const SettingsPage = lazy(() => import("@/pages/SettingsPage").then((m) => ({ default: m.SettingsPage })));
const ApiCenterPage = lazy(() => import("@/pages/ApiCenterPage").then((m) => ({ default: m.ApiCenterPage })));
const AgentManagerPage = lazy(() => import("@/pages/AgentManagerPage").then((m) => ({ default: m.AgentManagerPage })));
const WorkflowComposerPage = lazy(() => import("@/pages/WorkflowComposerPage").then((m) => ({ default: m.WorkflowComposerPage })));
const TaskExecutionPage = lazy(() => import("@/pages/TaskExecutionPage").then((m) => ({ default: m.TaskExecutionPage })));
const ToolMarketPage = lazy(() => import("@/pages/ToolMarketPage").then((m) => ({ default: m.ToolMarketPage })));
const CollaborationPage = lazy(() => import("@/pages/CollaborationPage").then((m) => ({ default: m.CollaborationPage })));

const nodes: Node[] = [
  { id: "frontend", position: { x: 50, y: 120 }, data: { label: "React Frontend" }, type: "default" },
  { id: "backend", position: { x: 350, y: 120 }, data: { label: "FastAPI Backend" }, type: "default" },
  { id: "llm", position: { x: 650, y: 120 }, data: { label: "LLM Providers" }, type: "default" },
  { id: "workflow", position: { x: 950, y: 120 }, data: { label: "Workflow Engine" }, type: "default" }
];

const edges: Edge[] = [
  { id: "e1-2", source: "frontend", target: "backend", label: "REST/WS" },
  { id: "e2-3", source: "backend", target: "llm", label: "API Gateway" },
  { id: "e2-4", source: "backend", target: "workflow", label: "Task Runtime" }
];

type TabKey =
  | "dashboard"
  | "settings"
  | "api-center"
  | "agents"
  | "workflow-composer"
  | "task-execution"
  | "tool-market"
  | "collaboration";

function App(): JSX.Element {
  const [tab, setTab] = useState<TabKey>("dashboard");
  const logs = useAppStore((state) => state.logs);
  const notice = useAppStore((state) => state.notice);

  useStatusSocket();

  return (
    <main className="mx-auto min-h-screen max-w-7xl space-y-4 p-6">
      <section className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-bold">lobster-claw 控制台</h1>
          <div className="flex flex-wrap gap-2 text-sm">
            {[
              ["dashboard", "仪表盘"],
              ["api-center", "API配置"],
              ["agents", "智能体"],
              ["workflow-composer", "任务编排"],
              ["task-execution", "任务执行"],
              ["tool-market", "工具市场"],
              ["collaboration", "协作分享"],
              ["settings", "设置"]
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`rounded px-3 py-1 ${tab === key ? "bg-sky-400 text-slate-950" : "bg-slate-800 text-slate-100"}`}
                onClick={() => setTab(key as TabKey)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[220px] rounded border border-slate-800">
          <ReactFlow nodes={nodes} edges={edges} fitView>
            <MiniMap />
            <Controls />
            <Background gap={16} />
          </ReactFlow>
        </div>
      </section>

      {notice ? (
        <section className="rounded border border-sky-700 bg-sky-950/40 p-3 text-sm text-sky-100">{notice}</section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <section>
          <Suspense fallback={<div className="rounded border border-slate-700 bg-slate-900/60 p-4 text-sm">加载中...</div>}>
            {tab === "dashboard" ? <DashboardPage /> : null}
            {tab === "settings" ? <SettingsPage /> : null}
            {tab === "api-center" ? <ApiCenterPage /> : null}
            {tab === "agents" ? <AgentManagerPage /> : null}
            {tab === "workflow-composer" ? <WorkflowComposerPage /> : null}
            {tab === "task-execution" ? <TaskExecutionPage /> : null}
            {tab === "tool-market" ? <ToolMarketPage /> : null}
            {tab === "collaboration" ? <CollaborationPage /> : null}
          </Suspense>
        </section>
        <LogPanel logs={logs} />
      </div>
    </main>
  );
}

export default App;
