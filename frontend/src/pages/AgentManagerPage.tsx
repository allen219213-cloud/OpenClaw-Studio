import { useCallback, useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";

import {
  createAgent,
  deleteAgent,
  exportAgent,
  importAgent,
  listAgents,
  listTemplates,
  updateAgent
} from "@/services/api";
import { useAppStore } from "@/store/useAppStore";
import type { Agent, AgentInput, AgentTemplate } from "@/types/status";

const toolCandidates = ["web-search", "code-exec", "database", "browser", "file-system"];

const emptyAgent: AgentInput = {
  name: "",
  description: "",
  avatar: "🤖",
  system_prompt: "",
  model_config: { model: "openai/gpt-4.1-mini", temperature: 0.7, max_tokens: 2048 },
  tools: [],
  memory: { short_term_turns: 20, long_term_enabled: false, long_term_namespace: "default" },
  tags: []
};

export function AgentManagerPage(): JSX.Element {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [form, setForm] = useState<AgentInput>(emptyAgent);
  const [editingId, setEditingId] = useState("");
  const [wizardStep, setWizardStep] = useState(1);
  const [importFormat, setImportFormat] = useState<"json" | "yaml">("json");
  const [importContent, setImportContent] = useState("");
  const [busy, setBusy] = useState(false);
  const setNotice = useAppStore((state) => state.setNotice);

  const formError = useMemo(() => {
    if (!form.name.trim()) return "名称不能为空";
    if (!form.system_prompt.trim()) return "系统提示词不能为空";
    if (form.model_config.temperature < 0 || form.model_config.temperature > 2) return "温度必须在 0-2";
    if (form.model_config.max_tokens < 128) return "最大 tokens 不能小于 128";
    return "";
  }, [form]);

  const load = useCallback(async (): Promise<void> => {
    try {
      const [agentItems, templateItems] = await Promise.all([listAgents(query, "", tagFilter), listTemplates()]);
      setAgents(agentItems);
      setTemplates(templateItems);
    } catch {
      setNotice("智能体数据加载失败，请稍后重试");
    }
  }, [query, setNotice, tagFilter]);

  useEffect(() => {
    load();
  }, [load]);

  function patch<K extends keyof AgentInput>(key: K, value: AgentInput[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function patchModel(key: "model" | "temperature" | "max_tokens", value: string | number): void {
    setForm((prev) => ({
      ...prev,
      model_config: {
        ...prev.model_config,
        [key]: value
      }
    }));
  }

  function patchMemory(
    key: "short_term_turns" | "long_term_enabled" | "long_term_namespace",
    value: string | number | boolean
  ): void {
    setForm((prev) => ({
      ...prev,
      memory: {
        ...prev.memory,
        [key]: value
      }
    }));
  }

  function toggleTool(name: string): void {
    setForm((prev) => {
      const exists = prev.tools.some((item) => item.name === name);
      if (exists) {
        return { ...prev, tools: prev.tools.filter((item) => item.name !== name) };
      }
      return { ...prev, tools: [...prev.tools, { name, enabled: true, config: {} }] };
    });
  }

  function reset(): void {
    setForm(emptyAgent);
    setEditingId("");
    setWizardStep(1);
  }

  function applyTemplate(template: AgentTemplate): void {
    setForm(template.agent);
    setNotice(`已应用模板：${template.name}`);
    setWizardStep(1);
  }

  function edit(item: Agent): void {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description,
      avatar: item.avatar,
      system_prompt: item.system_prompt,
      model_config: item.model_config,
      tools: item.tools,
      memory: item.memory,
      tags: item.tags
    });
    setWizardStep(1);
  }

  async function submit(): Promise<void> {
    if (formError) {
      setNotice(formError);
      return;
    }

    setBusy(true);
    try {
      const res = editingId ? await updateAgent(editingId, form) : await createAgent(form);
      setNotice(res.message);
      reset();
      await load();
    } catch {
      setNotice("保存失败，请稍后重试");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string): Promise<void> {
    setBusy(true);
    try {
      const res = await deleteAgent(id);
      setNotice(res.message);
      await load();
    } catch {
      setNotice("删除失败，请稍后重试");
    } finally {
      setBusy(false);
    }
  }

  async function handleExport(id: string, format: "json" | "yaml"): Promise<void> {
    setBusy(true);
    try {
      const content = await exportAgent(id, format);
      await navigator.clipboard.writeText(content);
      setNotice(`导出成功，${format.toUpperCase()} 已复制到剪贴板`);
    } catch {
      setNotice("导出失败，请稍后再试");
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
      const res = await importAgent(importFormat, importContent);
      setNotice(res.message);
      setImportContent("");
      await load();
    } catch {
      setNotice("导入失败，请检查格式");
    } finally {
      setBusy(false);
    }
  }

  const previewMarkdown = useMemo(() => {
    return [
      `# ${form.avatar} ${form.name || "未命名智能体"}`,
      form.description || "暂无描述",
      "",
      "## 系统提示词",
      form.system_prompt || "(空)",
      "",
      "## 模型配置",
      `- 模型: ${form.model_config.model}`,
      `- 温度: ${form.model_config.temperature}`,
      `- 最大 Tokens: ${form.model_config.max_tokens}`,
      "",
      "## 工具",
      form.tools.length ? form.tools.map((item) => `- ${item.name}`).join("\n") : "- 无",
      "",
      "## 记忆",
      `- 短期记忆轮数: ${form.memory.short_term_turns}`,
      `- 长期记忆: ${form.memory.long_term_enabled ? "开启" : "关闭"}`,
      `- 命名空间: ${form.memory.long_term_namespace}`
    ].join("\n");
  }, [form]);

  return (
    <section className="space-y-4">
      <section className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
        <h3 className="text-lg font-semibold">智能体列表</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <input
            className="rounded border border-slate-700 bg-slate-950 p-2 text-sm"
            placeholder="搜索名称或描述"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <input
            className="rounded border border-slate-700 bg-slate-950 p-2 text-sm"
            placeholder="标签过滤"
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
          />
          <button className="rounded bg-sky-400 px-3 py-2 text-sm font-semibold text-slate-950" onClick={load}>
            刷新
          </button>
        </div>

        <div className="mt-3 space-y-2">
          {agents.length === 0 ? (
            <p className="text-sm text-slate-400">暂无智能体</p>
          ) : (
            agents.map((item) => (
              <article key={item.id} className="rounded bg-slate-950 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-slate-100">
                      {item.avatar} {item.name}
                    </p>
                    <p className="text-xs text-slate-400">{item.description || "无描述"}</p>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <button className="rounded bg-slate-700 px-2 py-1" onClick={() => edit(item)}>
                      编辑
                    </button>
                    <button className="rounded bg-emerald-600 px-2 py-1" onClick={() => handleExport(item.id, "json")}>
                      导出 JSON
                    </button>
                    <button className="rounded bg-amber-600 px-2 py-1" onClick={() => handleExport(item.id, "yaml")}>
                      导出 YAML
                    </button>
                    <button className="rounded bg-rose-600 px-2 py-1" onClick={() => remove(item.id)}>
                      删除
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
        <h3 className="text-lg font-semibold">模板库（10+）</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {templates.map((item) => (
            <article key={item.id} className="rounded bg-slate-950 p-3">
              <p className="text-slate-100">{item.name}</p>
              <p className="text-xs text-slate-400">{item.description}</p>
              <button
                className="mt-2 rounded bg-sky-400 px-2 py-1 text-xs font-semibold text-slate-950"
                onClick={() => applyTemplate(item)}
              >
                使用模板
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
          <h3 className="text-lg font-semibold">智能体创建向导（第 {wizardStep} 步）</h3>
          <div className="mt-3 flex gap-2 text-xs">
            <button className="rounded bg-slate-700 px-2 py-1" onClick={() => setWizardStep(1)}>
              基本信息
            </button>
            <button className="rounded bg-slate-700 px-2 py-1" onClick={() => setWizardStep(2)}>
              角色设定
            </button>
            <button className="rounded bg-slate-700 px-2 py-1" onClick={() => setWizardStep(3)}>
              模型和工具
            </button>
            <button className="rounded bg-slate-700 px-2 py-1" onClick={() => setWizardStep(4)}>
              记忆配置
            </button>
          </div>

          {wizardStep === 1 ? (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="text-sm text-slate-300">
                名称
                <input
                  className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2"
                  value={form.name}
                  onChange={(e) => patch("name", e.target.value)}
                />
              </label>
              <label className="text-sm text-slate-300">
                头像
                <input
                  className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2"
                  value={form.avatar}
                  onChange={(e) => patch("avatar", e.target.value)}
                />
              </label>
              <label className="text-sm text-slate-300 md:col-span-2">
                描述
                <textarea
                  className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2"
                  rows={3}
                  value={form.description}
                  onChange={(e) => patch("description", e.target.value)}
                />
              </label>
              <label className="text-sm text-slate-300 md:col-span-2">
                标签（逗号分隔）
                <input
                  className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2"
                  value={form.tags.join(",")}
                  onChange={(e) =>
                    patch(
                      "tags",
                      e.target.value
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean)
                    )
                  }
                />
              </label>
            </div>
          ) : null}

          {wizardStep === 2 ? (
            <label className="mt-3 block text-sm text-slate-300">
              系统提示词（Markdown）
              <textarea
                className="mt-1 h-48 w-full rounded border border-slate-700 bg-slate-950 p-2"
                value={form.system_prompt}
                onChange={(e) => patch("system_prompt", e.target.value)}
              />
            </label>
          ) : null}

          {wizardStep === 3 ? (
            <div className="mt-3 grid gap-3">
              <label className="text-sm text-slate-300">
                模型
                <input
                  className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2"
                  value={form.model_config.model}
                  onChange={(e) => patchModel("model", e.target.value)}
                />
              </label>
              <label className="text-sm text-slate-300">
                温度
                <input
                  className="mt-1 w-full"
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={form.model_config.temperature}
                  onChange={(e) => patchModel("temperature", Number(e.target.value))}
                />
                <span className="text-xs text-slate-400">{form.model_config.temperature}</span>
              </label>
              <label className="text-sm text-slate-300">
                最大 Tokens
                <input
                  className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2"
                  type="number"
                  value={form.model_config.max_tokens}
                  onChange={(e) => patchModel("max_tokens", Number(e.target.value))}
                />
              </label>
              <div>
                <p className="text-sm text-slate-300">工具配置</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {toolCandidates.map((name) => {
                    const enabled = form.tools.some((item) => item.name === name);
                    return (
                      <button
                        key={name}
                        className={`rounded px-2 py-1 ${enabled ? "bg-sky-500 text-slate-950" : "bg-slate-700"}`}
                        onClick={() => toggleTool(name)}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          {wizardStep === 4 ? (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="text-sm text-slate-300">
                短期记忆轮数
                <input
                  className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2"
                  type="number"
                  value={form.memory.short_term_turns}
                  onChange={(e) => patchMemory("short_term_turns", Number(e.target.value))}
                />
              </label>
              <label className="text-sm text-slate-300">
                命名空间
                <input
                  className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2"
                  value={form.memory.long_term_namespace}
                  onChange={(e) => patchMemory("long_term_namespace", e.target.value)}
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300 md:col-span-2">
                <input
                  type="checkbox"
                  checked={form.memory.long_term_enabled}
                  onChange={(e) => patchMemory("long_term_enabled", e.target.checked)}
                />
                启用长期记忆
              </label>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="rounded bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
              disabled={busy || Boolean(formError)}
              onClick={submit}
            >
              {editingId ? "保存智能体" : "创建智能体"}
            </button>
            {editingId ? (
              <button className="rounded bg-slate-700 px-4 py-2 text-sm" onClick={reset}>
                取消编辑
              </button>
            ) : null}
          </div>
        </article>

        <article className="space-y-4">
          <section className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
            <h3 className="text-lg font-semibold">实时预览</h3>
            <div className="prose prose-invert mt-3 max-w-none rounded bg-slate-950 p-3 text-sm">
              <ReactMarkdown>{previewMarkdown}</ReactMarkdown>
            </div>
          </section>

          <section className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
            <h3 className="text-lg font-semibold">导入配置（JSON/YAML）</h3>
            <div className="mt-2 flex gap-2">
              <select
                className="rounded border border-slate-700 bg-slate-950 p-2 text-sm"
                value={importFormat}
                onChange={(e) => setImportFormat(e.target.value as "json" | "yaml")}
              >
                <option value="json">JSON</option>
                <option value="yaml">YAML</option>
              </select>
              <button
                className="rounded bg-emerald-600 px-3 py-2 text-sm font-semibold"
                onClick={handleImport}
                disabled={busy}
              >
                导入
              </button>
            </div>
            <textarea
              className="mt-2 h-40 w-full rounded border border-slate-700 bg-slate-950 p-2 text-xs"
              value={importContent}
              onChange={(e) => setImportContent(e.target.value)}
              placeholder="粘贴 JSON 或 YAML"
            />
          </section>
        </article>
      </section>
    </section>
  );
}
