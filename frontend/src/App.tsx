import { Background, Controls, MiniMap, ReactFlow, type Edge, type Node } from "reactflow";
import "reactflow/dist/style.css";
import { useState } from "react";

import { ApiCenterPage } from "@/pages/ApiCenterPage";
import { AgentManagerPage } from "@/pages/AgentManagerPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { LogPanel } from "@/components/LogPanel";
import { useStatusSocket } from "@/hooks/useStatusSocket";
import { useAppStore } from "@/store/useAppStore";

const nodes: Node[] = [
  { id: "frontend", position: { x: 50, y: 120 }, data: { label: "React Frontend" }, type: "default" },
  { id: "backend", position: { x: 350, y: 120 }, data: { label: "FastAPI Backend" }, type: "default" },
  { id: "llm", position: { x: 650, y: 120 }, data: { label: "LLM Providers" }, type: "default" }
];

const edges: Edge[] = [
  { id: "e1-2", source: "frontend", target: "backend", label: "REST/WS" },
  { id: "e2-3", source: "backend", target: "llm", label: "API Gateway" }
];

type TabKey = "dashboard" | "settings" | "api-center" | "agents";

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
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`rounded px-3 py-1 text-sm ${tab === "dashboard" ? "bg-sky-400 text-slate-950" : "bg-slate-800 text-slate-100"}`}
              onClick={() => setTab("dashboard")}
            >
              仪表盘
            </button>
            <button
              type="button"
              className={`rounded px-3 py-1 text-sm ${tab === "api-center" ? "bg-sky-400 text-slate-950" : "bg-slate-800 text-slate-100"}`}
              onClick={() => setTab("api-center")}
            >
              API配置中心
            </button>
            <button
              type="button"
              className={`rounded px-3 py-1 text-sm ${tab === "agents" ? "bg-sky-400 text-slate-950" : "bg-slate-800 text-slate-100"}`}
              onClick={() => setTab("agents")}
            >
              智能体管理
            </button>
            <button
              type="button"
              className={`rounded px-3 py-1 text-sm ${tab === "settings" ? "bg-sky-400 text-slate-950" : "bg-slate-800 text-slate-100"}`}
              onClick={() => setTab("settings")}
            >
              设置
            </button>
          </div>
        </div>
        <div className="h-[240px] rounded border border-slate-800">
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
          {tab === "dashboard" ? <DashboardPage /> : null}
          {tab === "settings" ? <SettingsPage /> : null}
          {tab === "api-center" ? <ApiCenterPage /> : null}
          {tab === "agents" ? <AgentManagerPage /> : null}
        </section>
        <LogPanel logs={logs} />
      </div>
    </main>
  );
}

export default App;
