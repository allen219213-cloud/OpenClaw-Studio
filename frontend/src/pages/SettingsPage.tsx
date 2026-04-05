import { useCallback, useEffect, useState } from "react";

import {
  createBackup,
  getSettings,
  listBackups,
  restoreBackup,
  updateSettings
} from "@/services/api";
import { useAppStore } from "@/store/useAppStore";
import type { BackupInfo, SystemSettings } from "@/types/status";

const emptySettings: SystemSettings = {
  port: 8000,
  data_dir: "./runtime/data",
  log_level: "INFO",
  proxy_enabled: false,
  proxy_url: "",
  cors_origins: ["*"],
  openclaw_install_source: "",
  openclaw_start_command: "python -m openclaw"
};

export function SettingsPage(): JSX.Element {
  const [form, setForm] = useState<SystemSettings>(emptySettings);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [busy, setBusy] = useState(false);
  const setNotice = useAppStore((state) => state.setNotice);

  const load = useCallback(async (): Promise<void> => {
    try {
      const [settings, backupList] = await Promise.all([getSettings(), listBackups()]);
      setForm(settings);
      setBackups(backupList);
    } catch {
      setNotice("设置加载失败，请稍后重试");
    }
  }, [setNotice]);

  useEffect(() => {
    load();
  }, [load]);

  function patch<K extends keyof SystemSettings>(key: K, value: SystemSettings[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save(): Promise<void> {
    setBusy(true);
    try {
      const res = await updateSettings(form);
      setNotice(res.message);
    } catch {
      setNotice("设置保存失败，请检查输入信息");
    } finally {
      setBusy(false);
    }
  }

  async function backupNow(): Promise<void> {
    setBusy(true);
    try {
      const res = await createBackup();
      setNotice(res.message);
      await load();
    } catch {
      setNotice("备份失败，请稍后再试");
    } finally {
      setBusy(false);
    }
  }

  async function restore(name: string): Promise<void> {
    setBusy(true);
    try {
      const res = await restoreBackup(name);
      setNotice(res.message);
    } catch {
      setNotice("恢复失败，请稍后再试");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4">
      <section className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
        <h3 className="text-lg font-semibold">系统设置</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-sm text-slate-300">
            端口
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2"
              type="number"
              value={form.port}
              onChange={(e) => patch("port", Number(e.target.value))}
            />
          </label>
          <label className="text-sm text-slate-300">
            数据目录
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2"
              value={form.data_dir}
              onChange={(e) => patch("data_dir", e.target.value)}
            />
          </label>
          <label className="text-sm text-slate-300">
            日志级别
            <select
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2"
              value={form.log_level}
              onChange={(e) => patch("log_level", e.target.value)}
            >
              <option value="DEBUG">DEBUG</option>
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="ERROR">ERROR</option>
            </select>
          </label>
          <label className="text-sm text-slate-300">
            OpenClaw 启动命令
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2"
              value={form.openclaw_start_command}
              onChange={(e) => patch("openclaw_start_command", e.target.value)}
            />
          </label>
          <label className="text-sm text-slate-300 md:col-span-2">
            OpenClaw 安装源（pip 包名或 URL）
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2"
              value={form.openclaw_install_source}
              onChange={(e) => patch("openclaw_install_source", e.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
        <h3 className="text-lg font-semibold">网络设置</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-sm text-slate-300">
            代理地址
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2"
              value={form.proxy_url}
              onChange={(e) => patch("proxy_url", e.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 pt-7 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={form.proxy_enabled}
              onChange={(e) => patch("proxy_enabled", e.target.checked)}
            />
            启用代理
          </label>
          <label className="text-sm text-slate-300 md:col-span-2">
            CORS 来源（逗号分隔）
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2"
              value={form.cors_origins.join(",")}
              onChange={(e) =>
                patch(
                  "cors_origins",
                  e.target.value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean)
                )
              }
            />
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
        <h3 className="text-lg font-semibold">备份与恢复</h3>
        <button
          type="button"
          disabled={busy}
          className="mt-3 rounded bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
          onClick={backupNow}
        >
          一键备份
        </button>
        <div className="mt-3 space-y-2 text-sm">
          {backups.length === 0 ? (
            <p className="text-slate-400">暂无备份文件</p>
          ) : (
            backups.map((item) => (
              <article key={item.name} className="flex items-center justify-between rounded bg-slate-950 p-2">
                <div>
                  <p className="text-slate-200">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.created_at}</p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  className="rounded bg-sky-400 px-3 py-1 text-xs font-semibold text-slate-950 disabled:opacity-60"
                  onClick={() => restore(item.name)}
                >
                  恢复
                </button>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
        <h3 className="text-lg font-semibold">关于</h3>
        <p className="mt-2 text-sm text-slate-300">版本：0.1.0</p>
        <p className="text-sm text-slate-400">更新检查：请关注项目仓库发布页</p>
        <a className="text-sm text-sky-300" href="https://github.com" target="_blank" rel="noreferrer">
          项目链接
        </a>
      </section>

      <button
        type="button"
        disabled={busy}
        className="rounded bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
        onClick={save}
      >
        保存全部设置
      </button>
    </section>
  );
}
