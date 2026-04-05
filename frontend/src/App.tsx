import { Background, Controls, MiniMap, ReactFlow, type Edge, type Node } from "reactflow";
import "reactflow/dist/style.css";
import { useState } from "react";

import { DashboardPage } from "@/pages/DashboardPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { LogPanel } from "@/components/LogPanel";
import { useStatusSocket } from "@/hooks/useStatusSocket";
import { useAppStore } from "@/store/useAppStore";

const nodes: Node[] = [
  { id: "frontend", position: { x: 50, y: 120 }, data: { label: "React Frontend" }, type: "default" },
  { id: "backend", position: { x: 350, y: 120 }, data: { label: "FastAPI Backend" }, type: "default" },
  { id: "openclaw", position: { x: 650, y: 120 }, data: { label: "OpenClaw Core" }, type: "default" }
];

const edges: Edge[] = [
  { id: "e1-2", source: "frontend", target: "backend", label: "REST/WS" },
  { id: "e2-3", source: "backend", target: "openclaw", label: "Service Control" }
];

function App(): JSX.Element {
  const [tab, setTab] = useState<"dashboard" | "settings">("dashboard");
  const logs = useAppStore((state) => state.logs);
  const notice = useAppStore((state) => state.notice);

  useStatusSocket();

  return (
    <main className="mx-auto min-h-screen max-w-7xl space-y-4 p-6">
      <section className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold">lobster-claw 控制台</h1>
          <div className="flex gap-2">
            <button
              type="button"
              className={`rounded px-3 py-1 text-sm ${tab === "dashboard" ? "bg-sky-400 text-slate-950" : "bg-slate-800 text-slate-100"}`}
              onClick={() => setTab("dashboard")}
            >
              仪表盘
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
        <div className="h-[260px] rounded border border-slate-800">
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
        <section>{tab === "dashboard" ? <DashboardPage /> : <SettingsPage />}</section>
        <LogPanel logs={logs} />
      </div>
    </main>
  );
}

export default App;
