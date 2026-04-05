import { Background, Controls, MiniMap, ReactFlow, type Edge, type Node } from "reactflow";
import "reactflow/dist/style.css";

import { LogPanel } from "@/components/LogPanel";
import { useStatusSocket } from "@/hooks/useStatusSocket";
import { DashboardPage } from "@/pages/DashboardPage";
import { useAppStore } from "@/store/useAppStore";

const nodes: Node[] = [
  { id: "frontend", position: { x: 50, y: 100 }, data: { label: "React Frontend" }, type: "default" },
  { id: "backend", position: { x: 350, y: 100 }, data: { label: "FastAPI Backend" }, type: "default" }
];

const edges: Edge[] = [{ id: "e1-2", source: "frontend", target: "backend", label: "REST + WS" }];

function App(): JSX.Element {
  const logs = useAppStore((state) => state.logs);
  useStatusSocket();

  return (
    <main className="mx-auto grid min-h-screen max-w-6xl gap-4 p-6 lg:grid-cols-2">
      <section className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
        <h1 className="mb-3 text-2xl font-bold">lobster-claw</h1>
        <div className="h-[420px] rounded border border-slate-800">
          <ReactFlow nodes={nodes} edges={edges} fitView>
            <MiniMap />
            <Controls />
            <Background gap={16} />
          </ReactFlow>
        </div>
      </section>

      <section className="space-y-4">
        <DashboardPage />
        <LogPanel logs={logs} />
      </section>
    </main>
  );
}

export default App;
