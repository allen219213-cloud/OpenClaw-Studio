import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createProviderConfig,
  deleteProviderConfig,
  listProviderConfigs,
  listProviderMeta,
  testProviderConfig,
  updateProviderConfig
} from "@/services/api";
import { useAppStore } from "@/store/useAppStore";
import type { ProviderConfig, ProviderInput, ProviderMeta } from "@/types/status";

const emptyForm: ProviderInput = {
  provider: "openai",
  name: "",
  api_key: "",
  base_url: "",
  proxy_url: "",
  default_model: "",
  quota_limit: 0,
  quota_used: 0
};

export function ApiCenterPage(): JSX.Element {
  const [items, setItems] = useState<ProviderConfig[]>([]);
  const [meta, setMeta] = useState<ProviderMeta[]>([]);
  const [form, setForm] = useState<ProviderInput>(emptyForm);
  const [editingId, setEditingId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const setNotice = useAppStore((state) => state.setNotice);

  const formError = useMemo(() => {
    if (!form.name.trim()) return "配置名称不能为空";
    if (!form.api_key.trim() && !editingId) return "API Key 不能为空";
    return "";
  }, [editingId, form.api_key, form.name]);

  const load = useCallback(async (): Promise<void> => {
    try {
      const [configs, providers] = await Promise.all([listProviderConfigs(), listProviderMeta()]);
      setItems(configs);
      setMeta(providers);
    } catch {
      setNotice("API 配置加载失败，请稍后重试");
    }
  }, [setNotice]);

  useEffect(() => {
    load();
  }, [load]);

  function patch<K extends keyof ProviderInput>(key: K, value: ProviderInput[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function reset(): void {
    setForm(emptyForm);
    setEditingId("");
  }

  async function submit(): Promise<void> {
    if (formError) {
      setNotice(formError);
      return;
    }

    setBusy(true);
    try {
      const res = editingId ? await updateProviderConfig(editingId, form) : await createProviderConfig(form);
      setNotice(res.message);
      reset();
      await load();
    } catch {
      setNotice("保存失败，请检查配置后重试");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string): Promise<void> {
    setBusy(true);
    try {
      const res = await deleteProviderConfig(id);
      setNotice(res.message);
      await load();
    } catch {
      setNotice("删除失败，请稍后重试");
    } finally {
      setBusy(false);
    }
  }

  async function test(id: string): Promise<void> {
    setBusy(true);
    try {
      const res = await testProviderConfig(id);
      setNotice(res.message);
    } catch {
      setNotice("连接测试失败，请稍后重试");
    } finally {
      setBusy(false);
    }
  }

  function edit(item: ProviderConfig): void {
    setEditingId(item.id);
    setForm({
      provider: item.provider,
      name: item.name,
      api_key: "",
      base_url: item.base_url,
      proxy_url: item.proxy_url,
      default_model: item.default_model,
      quota_limit: item.quota_limit,
      quota_used: item.quota_used
    });
  }

  return (
    <section className="space-y-4">
      <section className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
        <h3 className="text-lg font-semibold">API 配置中心</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-sm text-slate-300">
            提供商
            <select
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2"
              value={form.provider}
              onChange={(e) => patch("provider", e.target.value)}
            >
              {meta.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-300">
            配置名称
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2"
              value={form.name}
              onChange={(e) => patch("name", e.target.value)}
            />
          </label>
          <label className="text-sm text-slate-300">
            API Key {editingId ? "（留空表示不修改）" : ""}
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2"
              value={form.api_key}
              onChange={(e) => patch("api_key", e.target.value)}
              type="password"
            />
          </label>
          <label className="text-sm text-slate-300">
            默认模型
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2"
              value={form.default_model}
              onChange={(e) => patch("default_model", e.target.value)}
            />
          </label>
          <label className="text-sm text-slate-300">
            Base URL
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2"
              value={form.base_url}
              onChange={(e) => patch("base_url", e.target.value)}
            />
          </label>
          <label className="text-sm text-slate-300">
            代理 URL
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2"
              value={form.proxy_url}
              onChange={(e) => patch("proxy_url", e.target.value)}
            />
          </label>
          <label className="text-sm text-slate-300">
            限额
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2"
              type="number"
              value={form.quota_limit}
              onChange={(e) => patch("quota_limit", Number(e.target.value))}
            />
          </label>
          <label className="text-sm text-slate-300">
            已用额度
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2"
              type="number"
              value={form.quota_used}
              onChange={(e) => patch("quota_used", Number(e.target.value))}
            />
          </label>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={busy || Boolean(formError)}
            className="rounded bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
            onClick={submit}
          >
            {editingId ? "保存修改" : "新增配置"}
          </button>
          {editingId ? (
            <button
              type="button"
              className="rounded bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-100"
              onClick={reset}
            >
              取消编辑
            </button>
          ) : null}
        </div>
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
        <h3 className="mb-3 text-lg font-semibold">已配置 API</h3>
        <div className="space-y-2">
          {items.length === 0 ? (
            <p className="text-sm text-slate-400">暂无配置</p>
          ) : (
            items.map((item) => (
              <article key={item.id} className="rounded bg-slate-950 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-slate-100">{item.name}</p>
                    <p className="text-xs text-slate-400">
                      {item.provider} · {item.api_key_masked} · 默认模型 {item.default_model || "-"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded bg-slate-700 px-2 py-1 text-xs" onClick={() => edit(item)}>
                      编辑
                    </button>
                    <button className="rounded bg-emerald-600 px-2 py-1 text-xs" onClick={() => test(item.id)}>
                      测试连接
                    </button>
                    <button className="rounded bg-rose-600 px-2 py-1 text-xs" onClick={() => remove(item.id)}>
                      删除
                    </button>
                  </div>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded bg-slate-800">
                  <div
                    className="h-full bg-amber-400 transition-all"
                    style={{ width: `${Math.min(item.usage_percent, 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  使用率：{item.usage_percent}%（{item.quota_used}/{item.quota_limit}）
                </p>
              </article>
            ))
          )}
        </div>
      </section>
    </section>
  );
}
