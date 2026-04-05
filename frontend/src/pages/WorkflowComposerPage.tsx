import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  addEdge,
  type Connection,
  type Edge,
  type Node
} from "reactflow";
import "reactflow/dist/style.css";

import {
  createWorkflow,
  deleteWorkflow,
  exportWorkflow,
  importWorkflow,
  listWorkflowTemplates,
  listWorkflows,
  updateWorkflow
} from "@/services/api";
import { useAppStore } from "@/store/useAppStore";
import type { Workflow, WorkflowInput, WorkflowTemplate } from "@/types/status";

const nodePalette = [
  { type: "start", label: "开始" },
  { type: "end", label: "结束" },
  { type: "agent", label: "智能体" },
  { type: "condition", label: "条件判断" },
  { type: "loop", label: "循环" },
  { type: "parallel", label: "并行" }
];

const emptyWorkflow: WorkflowInput = {
  name: "",
  description: "",
  category: "general",
  tags: [],
  graph: { nodes: [], edges: [] },
  variables: {},
  compatibility_mode: "openclaw-v1"
};

function toFlowNodes(nodes: Workflow["graph"]["nodes"]): Node[] {
  return nodes.map((n) => ({ ...n, data: { label: n.data.label || n.type, ...n.data } }));
}

function toFlowEdges(edges: Workflow["graph"]["edges"]): Edge[] {
  return edges.map((e) => ({ ...e, label: e.label || "" }));
}

export function WorkflowComposerPage(): JSX.Element {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState<WorkflowInput>(emptyWorkflow);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [importFormat, setImportFormat] = useState<"json" | "yaml">("json");
  const [importContent, setImportContent] = useState("");
  const [busy, setBusy] = useState(false);
  const setNotice = useAppStore((state) => state.setNotice);

  const selectedNode = useMemo(() => nodes.find((item) => item.id === selectedNodeId), [nodes, selectedNodeId]);

  const load = useCallback(async (): Promise<void> => {
    try {
      const [wf, tpl] = await Promise.all([listWorkflows(), listWorkflowTemplates()]);
      setWorkflows(wf);
      setTemplates(tpl);
    } catch {
      setNotice("任务数据加载失败，请稍后重试");
    }
  }, [setNotice]);

  useEffect(() => {
    load();
  }, [load]);

  function chooseWorkflow(item: Workflow): void {
    setSelectedId(item.id);
    setForm({
      name: item.name,
      description: item.description,
      category: item.category,
      tags: item.tags,
      graph: item.graph,
      variables: item.variables,
      compatibility_mode: item.compatibility_mode
    });
    setNodes(toFlowNodes(item.graph.nodes));
    setEdges(toFlowEdges(item.graph.edges));
    setSelectedNodeId("");
  }

  function applyTemplate(item: WorkflowTemplate): void {
    setSelectedId("");
    setForm(item.workflow);
    setNodes(toFlowNodes(item.workflow.graph.nodes));
    setEdges(toFlowEdges(item.workflow.graph.edges));
    setSelectedNodeId("");
    setNotice(`已应用模板：${item.name}`);
  }

  function addNode(type: string, label: string): void {
    const id = `${type}-${Date.now()}`;
    setNodes((prev) => [
      ...prev,
      { id, type: "default", position: { x: 100 + prev.length * 30, y: 100 + prev.length * 20 }, data: { label, nodeType: type } }
    ]);
  }

  function onConnect(params: Edge | Connection): void {
    setEdges((eds) => addEdge({ ...params, label: "next" }, eds));
  }

  function patchNodeData(key: string, value: string): void {
    if (!selectedNode) return;
    setNodes((prev) =>
      prev.map((item) =>
        item.id === selectedNode.id ? { ...item, data: { ...item.data, [key]: value, label: key === "label" ? value : item.data.label } } : item
      )
    );
  }

  function patchForm<K extends keyof WorkflowInput>(key: K, value: WorkflowInput[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save(): Promise<void> {
    if (!form.name.trim()) {
      setNotice("任务名称不能为空");
      return;
    }
    if (nodes.length === 0) {
      setNotice("请至少添加一个节点");
      return;
    }
    setBusy(true);
    try {
      const payload: WorkflowInput = {
        ...form,
        graph: {
          nodes: nodes.map((n) => ({
            id: n.id,
            type: (n.data.nodeType as string) || n.type || "agent",
            position: n.position,
            data: n.data
          })),
          edges: edges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            label: typeof e.label === "string" ? e.label : "",
            data: e.data || {}
          }))
        }
      };
      const res = selectedId ? await updateWorkflow(selectedId, payload) : await createWorkflow(payload);
      setNotice(res.message);
      await load();
    } catch {
      setNotice("保存任务失败，请稍后重试");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string): Promise<void> {
    setBusy(true);
    try {
      const res = await deleteWorkflow(id);
      setNotice(res.message);
      if (selectedId === id) {
        setSelectedId("");
        setForm(emptyWorkflow);
        setNodes([]);
        setEdges([]);
      }
      await load();
    } catch {
      setNotice("删除任务失败");
    } finally {
      setBusy(false);
    }
  }

  async function handleExport(id: string, format: "json" | "yaml"): Promise<void> {
    setBusy(true);
    try {
      const content = await exportWorkflow(id, format);
      await navigator.clipboard.writeText(content);
      setNotice(`任务已导出为 ${format.toUpperCase()} 并复制到剪贴板`);
    } catch {
      setNotice("导出失败");
    } finally {
      setBusy(false);
    }
  }

  async function handleImport(): Promise<void> {
    if (!importContent.trim()) {
      setNotice("导入内容不能为空");
      return;
    }
    setBusy(true);
    try {
      const res = await importWorkflow(importFormat, importContent);
      setNotice(res.message);
      await load();
      setImportContent("");
    } catch {
      setNotice("导入失败，请检查格式");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4">
      <section className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
        <h3 className="text-lg font-semibold">任务可视化编排器</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <input
            className="rounded border border-slate-700 bg-slate-950 p-2 text-sm"
            placeholder="任务名称"
            value={form.name}
            onChange={(e) => patchForm("name", e.target.value)}
          />
          <input
            className="rounded border border-slate-700 bg-slate-950 p-2 text-sm"
            placeholder="分类"
            value={form.category}
            onChange={(e) => patchForm("category", e.target.value)}
          />
          <input
            className="rounded border border-slate-700 bg-slate-950 p-2 text-sm"
            placeholder="标签（逗号分隔）"
            value={form.tags.join(",")}
            onChange={(e) =>
              patchForm(
                "tags",
                e.target.value
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean)
              )
            }
          />
          <textarea
            className="rounded border border-slate-700 bg-slate-950 p-2 text-sm md:col-span-3"
            rows={2}
            placeholder="任务描述"
            value={form.description}
            onChange={(e) => patchForm("description", e.target.value)}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {nodePalette.map((item) => (
            <button
              key={item.type}
              className="rounded bg-slate-700 px-3 py-1 text-xs"
              onClick={() => addNode(item.type, item.label)}
            >
              + {item.label}
            </button>
          ))}
        </div>

        <div className="mt-3 h-[360px] rounded border border-slate-800">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={(changes) =>
              setNodes((prev) => {
                const removedIds = new Set(changes.filter((c) => c.type === "remove").map((c) => c.id));
                if (removedIds.size === 0) return prev;
                return prev.filter((n) => !removedIds.has(n.id));
              })
            }
            onEdgesChange={(changes) =>
              setEdges((prev) => {
                const removedIds = new Set(changes.filter((c) => c.type === "remove").map((c) => c.id));
                if (removedIds.size === 0) return prev;
                return prev.filter((n) => !removedIds.has(n.id));
              })
            }
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onConnect={onConnect}
            fitView
          >
            <MiniMap />
            <Controls />
            <Background gap={16} />
          </ReactFlow>
        </div>

        <div className="mt-3 flex gap-2">
          <button className="rounded bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950" onClick={save} disabled={busy}>
            {selectedId ? "保存任务" : "创建任务"}
          </button>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
          <h3 className="text-lg font-semibold">节点属性面板</h3>
          {selectedNode ? (
            <div className="mt-3 space-y-2 text-sm">
              <p>节点ID：{selectedNode.id}</p>
              <input
                className="w-full rounded border border-slate-700 bg-slate-950 p-2"
                value={(selectedNode.data.label as string) || ""}
                onChange={(e) => patchNodeData("label", e.target.value)}
                placeholder="节点名称"
              />
              <input
                className="w-full rounded border border-slate-700 bg-slate-950 p-2"
                value={(selectedNode.data.agent_id as string) || ""}
                onChange={(e) => patchNodeData("agent_id", e.target.value)}
                placeholder="agent_id（智能体节点）"
              />
              <textarea
                className="w-full rounded border border-slate-700 bg-slate-950 p-2"
                rows={3}
                value={(selectedNode.data.expression as string) || ""}
                onChange={(e) => patchNodeData("expression", e.target.value)}
                placeholder="条件表达式（条件节点）"
              />
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-400">点击图中的节点后可编辑属性</p>
          )}
        </article>

        <article className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
          <h3 className="text-lg font-semibold">任务模板库（20+）</h3>
          <div className="mt-3 max-h-[240px] space-y-2 overflow-y-auto">
            {templates.map((item) => (
              <article key={item.id} className="rounded bg-slate-950 p-2 text-sm">
                <p>{item.name}</p>
                <p className="text-xs text-slate-400">{item.category}</p>
                <button className="mt-1 rounded bg-sky-500 px-2 py-1 text-xs text-slate-950" onClick={() => applyTemplate(item)}>
                  应用模板
                </button>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
        <h3 className="text-lg font-semibold">任务列表 / 导入导出</h3>
        <div className="mt-3 space-y-2">
          {workflows.map((item) => (
            <article key={item.id} className="flex flex-wrap items-center justify-between rounded bg-slate-950 p-2 text-sm">
              <div>
                <p>{item.name}</p>
                <p className="text-xs text-slate-400">{item.category}</p>
              </div>
              <div className="flex gap-2 text-xs">
                <button className="rounded bg-slate-700 px-2 py-1" onClick={() => chooseWorkflow(item)}>
                  编辑
                </button>
                <button className="rounded bg-emerald-600 px-2 py-1" onClick={() => handleExport(item.id, "json")}>
                  导出JSON
                </button>
                <button className="rounded bg-amber-600 px-2 py-1" onClick={() => handleExport(item.id, "yaml")}>
                  导出YAML
                </button>
                <button className="rounded bg-rose-600 px-2 py-1" onClick={() => remove(item.id)}>
                  删除
                </button>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <select
            className="rounded border border-slate-700 bg-slate-950 p-2 text-sm"
            value={importFormat}
            onChange={(e) => setImportFormat(e.target.value as "json" | "yaml")}
          >
            <option value="json">JSON</option>
            <option value="yaml">YAML</option>
          </select>
          <button className="rounded bg-sky-400 px-3 py-2 text-sm text-slate-950" onClick={handleImport}>
            导入任务
          </button>
        </div>
        <textarea
          className="mt-2 h-36 w-full rounded border border-slate-700 bg-slate-950 p-2 text-xs"
          value={importContent}
          onChange={(e) => setImportContent(e.target.value)}
          placeholder="粘贴任务 JSON / YAML（OpenClaw 兼容结构）"
        />
      </section>
    </section>
  );
}
