import { useCallback, useEffect, useState } from "react";

import {
  addToolReview,
  installTool,
  listToolReviews,
  listTools
} from "@/services/api";
import { useAppStore } from "@/store/useAppStore";
import type { ToolItem, ToolReview } from "@/types/status";

export function ToolMarketPage(): JSX.Element {
  const [query, setQuery] = useState("");
  const [tools, setTools] = useState<ToolItem[]>([]);
  const [reviews, setReviews] = useState<ToolReview[]>([]);
  const [selectedTool, setSelectedTool] = useState("");
  const [busy, setBusy] = useState(false);
  const setNotice = useAppStore((s) => s.setNotice);

  const [installForm, setInstallForm] = useState({
    name: "",
    description: "",
    repo: "",
    version: "latest"
  });

  const [reviewForm, setReviewForm] = useState({
    user_id: "anonymous",
    rating: 5,
    comment: ""
  });

  const loadTools = useCallback(async () => {
    try {
      setTools(await listTools(query));
    } catch {
      setNotice("工具列表加载失败");
    }
  }, [query, setNotice]);

  useEffect(() => {
    loadTools();
  }, [loadTools]);

  async function openReviews(toolName: string): Promise<void> {
    setSelectedTool(toolName);
    try {
      setReviews(await listToolReviews(toolName));
    } catch {
      setNotice("评论加载失败");
    }
  }

  async function submitInstall(): Promise<void> {
    if (!installForm.name.trim()) {
      setNotice("工具名称不能为空");
      return;
    }
    setBusy(true);
    try {
      const res = await installTool({
        ...installForm,
        config_schema: {}
      });
      setNotice(res.message);
      setInstallForm({ name: "", description: "", repo: "", version: "latest" });
      await loadTools();
    } catch {
      setNotice("工具安装失败");
    } finally {
      setBusy(false);
    }
  }

  async function submitReview(): Promise<void> {
    if (!selectedTool) return;
    setBusy(true);
    try {
      const res = await addToolReview({
        tool_name: selectedTool,
        user_id: reviewForm.user_id,
        rating: reviewForm.rating,
        comment: reviewForm.comment
      });
      setNotice(res.message);
      setReviewForm((prev) => ({ ...prev, comment: "" }));
      await openReviews(selectedTool);
      await loadTools();
    } catch {
      setNotice("评论提交失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4">
      <section className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
        <h3 className="text-lg font-semibold">工具市场</h3>
        <div className="mt-3 flex gap-2">
          <input
            className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-sm"
            placeholder="搜索工具"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="rounded bg-sky-500 px-3 py-2 text-sm text-slate-950" onClick={loadTools}>
            刷新
          </button>
        </div>

        <div className="mt-3 space-y-2">
          {tools.map((tool) => (
            <article key={tool.name} className="rounded bg-slate-950 p-3 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p>{tool.name}</p>
                  <p className="text-xs text-slate-400">{tool.description}</p>
                  <p className="text-xs text-amber-300">
                    评分 {tool.rating} / 5 ({tool.reviews} 条)
                  </p>
                </div>
                <button className="rounded bg-slate-700 px-2 py-1 text-xs" onClick={() => openReviews(tool.name)}>
                  评论
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
          <h3 className="text-lg font-semibold">一键安装第三方工具</h3>
          <div className="mt-3 grid gap-2">
            <input
              className="rounded border border-slate-700 bg-slate-950 p-2 text-sm"
              placeholder="工具名称"
              value={installForm.name}
              onChange={(e) => setInstallForm((v) => ({ ...v, name: e.target.value }))}
            />
            <input
              className="rounded border border-slate-700 bg-slate-950 p-2 text-sm"
              placeholder="描述"
              value={installForm.description}
              onChange={(e) => setInstallForm((v) => ({ ...v, description: e.target.value }))}
            />
            <input
              className="rounded border border-slate-700 bg-slate-950 p-2 text-sm"
              placeholder="仓库地址"
              value={installForm.repo}
              onChange={(e) => setInstallForm((v) => ({ ...v, repo: e.target.value }))}
            />
            <input
              className="rounded border border-slate-700 bg-slate-950 p-2 text-sm"
              placeholder="版本"
              value={installForm.version}
              onChange={(e) => setInstallForm((v) => ({ ...v, version: e.target.value }))}
            />
            <button className="rounded bg-emerald-500 px-3 py-2 text-sm text-slate-950" disabled={busy} onClick={submitInstall}>
              安装
            </button>
          </div>
        </article>

        <article className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
          <h3 className="text-lg font-semibold">评分与评论</h3>
          <p className="mt-1 text-xs text-slate-400">当前工具：{selectedTool || "未选择"}</p>
          <div className="mt-3 grid gap-2">
            <input
              className="rounded border border-slate-700 bg-slate-950 p-2 text-sm"
              placeholder="用户ID"
              value={reviewForm.user_id}
              onChange={(e) => setReviewForm((v) => ({ ...v, user_id: e.target.value }))}
            />
            <input
              type="number"
              min={1}
              max={5}
              className="rounded border border-slate-700 bg-slate-950 p-2 text-sm"
              value={reviewForm.rating}
              onChange={(e) => setReviewForm((v) => ({ ...v, rating: Number(e.target.value) }))}
            />
            <textarea
              className="rounded border border-slate-700 bg-slate-950 p-2 text-sm"
              placeholder="评论内容"
              value={reviewForm.comment}
              onChange={(e) => setReviewForm((v) => ({ ...v, comment: e.target.value }))}
            />
            <button className="rounded bg-sky-500 px-3 py-2 text-sm text-slate-950" disabled={!selectedTool || busy} onClick={submitReview}>
              提交评论
            </button>
          </div>
          <div className="mt-3 max-h-52 space-y-2 overflow-y-auto text-xs">
            {reviews.map((r) => (
              <article key={r.id} className="rounded bg-slate-950 p-2">
                <p className="text-amber-300">{r.rating} / 5 · {r.user_id}</p>
                <p className="text-slate-200">{r.comment || "无评论"}</p>
              </article>
            ))}
          </div>
        </article>
      </section>
    </section>
  );
}

