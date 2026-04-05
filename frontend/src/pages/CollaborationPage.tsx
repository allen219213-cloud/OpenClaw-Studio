import { useCallback, useEffect, useState } from "react";

import {
  createShare,
  createUser,
  downloadCommunityTemplate,
  listCommunityTemplates,
  listPublicShares,
  listUsers,
  login,
  rateCommunityTemplate,
  uploadCommunityTemplate
} from "@/services/api";
import { useAppStore } from "@/store/useAppStore";
import type { CommunityTemplate, ShareItem, UserInfo } from "@/types/status";

export function CollaborationPage(): JSX.Element {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [shares, setShares] = useState<ShareItem[]>([]);
  const [templates, setTemplates] = useState<CommunityTemplate[]>([]);
  const [busy, setBusy] = useState(false);
  const setNotice = useAppStore((s) => s.setNotice);

  const [loginForm, setLoginForm] = useState({ username: "admin", password: "admin123" });
  const [userForm, setUserForm] = useState({ username: "", password: "", role: "user" as "admin" | "user" });
  const [shareForm, setShareForm] = useState({
    resource_type: "workflow",
    resource_id: "",
    visibility: "public" as "public" | "private",
    owner: "admin"
  });
  const [tplForm, setTplForm] = useState({
    name: "",
    description: "",
    template_type: "workflow",
    author: "admin",
    content: "{}"
  });

  const load = useCallback(async () => {
    try {
      const [u, s, t] = await Promise.all([listUsers(), listPublicShares(), listCommunityTemplates()]);
      setUsers(u);
      setShares(s);
      setTemplates(t);
    } catch {
      setNotice("协作数据加载失败");
    }
  }, [setNotice]);

  useEffect(() => {
    load();
  }, [load]);

  async function doLogin(): Promise<void> {
    setBusy(true);
    try {
      const res = await login(loginForm);
      if (res.success && res.item) {
        localStorage.setItem("lc_session", JSON.stringify(res.item));
      }
      setNotice(res.message);
    } catch {
      setNotice("登录失败");
    } finally {
      setBusy(false);
    }
  }

  async function addUser(): Promise<void> {
    if (!userForm.username || !userForm.password) {
      setNotice("用户名和密码不能为空");
      return;
    }
    setBusy(true);
    try {
      const res = await createUser(userForm);
      setNotice(res.message);
      setUserForm({ username: "", password: "", role: "user" });
      await load();
    } catch {
      setNotice("创建用户失败");
    } finally {
      setBusy(false);
    }
  }

  async function addShare(): Promise<void> {
    if (!shareForm.resource_id) {
      setNotice("资源ID不能为空");
      return;
    }
    setBusy(true);
    try {
      const res = await createShare(shareForm);
      setNotice(res.message);
      await load();
    } catch {
      setNotice("创建分享失败");
    } finally {
      setBusy(false);
    }
  }

  async function uploadTemplate(): Promise<void> {
    if (!tplForm.name.trim()) {
      setNotice("模板名称不能为空");
      return;
    }
    setBusy(true);
    try {
      const res = await uploadCommunityTemplate({
        name: tplForm.name,
        description: tplForm.description,
        template_type: tplForm.template_type,
        author: tplForm.author,
        content: JSON.parse(tplForm.content || "{}")
      });
      setNotice(res.message);
      await load();
    } catch {
      setNotice("模板上传失败，请检查 JSON 内容");
    } finally {
      setBusy(false);
    }
  }

  async function downloadTemplate(templateId: string): Promise<void> {
    try {
      const res = await downloadCommunityTemplate(templateId);
      if (res.success && res.item) {
        await navigator.clipboard.writeText(JSON.stringify(res.item.content, null, 2));
        setNotice("模板已下载并复制内容到剪贴板");
      } else {
        setNotice(res.message || "模板下载失败");
      }
    } catch {
      setNotice("模板下载失败");
    }
  }

  async function rateTemplate(templateId: string, score: number): Promise<void> {
    try {
      const res = await rateCommunityTemplate(templateId, score);
      setNotice(res.message);
      await load();
    } catch {
      setNotice("评分失败");
    }
  }

  return (
    <section className="space-y-4">
      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
          <h3 className="text-lg font-semibold">多用户管理</h3>
          <div className="mt-3 grid gap-2">
            <p className="text-xs text-slate-400">默认管理员：admin / admin123</p>
            <div className="grid gap-2 md:grid-cols-3">
              <input className="rounded border border-slate-700 bg-slate-950 p-2 text-sm" placeholder="登录用户名" value={loginForm.username} onChange={(e) => setLoginForm((v) => ({ ...v, username: e.target.value }))} />
              <input className="rounded border border-slate-700 bg-slate-950 p-2 text-sm" type="password" placeholder="登录密码" value={loginForm.password} onChange={(e) => setLoginForm((v) => ({ ...v, password: e.target.value }))} />
              <button className="rounded bg-sky-500 px-3 py-2 text-sm text-slate-950" disabled={busy} onClick={doLogin}>登录</button>
            </div>
            <div className="grid gap-2 md:grid-cols-4">
              <input className="rounded border border-slate-700 bg-slate-950 p-2 text-sm" placeholder="新用户名" value={userForm.username} onChange={(e) => setUserForm((v) => ({ ...v, username: e.target.value }))} />
              <input className="rounded border border-slate-700 bg-slate-950 p-2 text-sm" type="password" placeholder="新密码" value={userForm.password} onChange={(e) => setUserForm((v) => ({ ...v, password: e.target.value }))} />
              <select className="rounded border border-slate-700 bg-slate-950 p-2 text-sm" value={userForm.role} onChange={(e) => setUserForm((v) => ({ ...v, role: e.target.value as "admin" | "user" }))}>
                <option value="user">普通用户</option>
                <option value="admin">管理员</option>
              </select>
              <button className="rounded bg-emerald-500 px-3 py-2 text-sm text-slate-950" onClick={addUser}>创建用户</button>
            </div>
          </div>
          <div className="mt-3 max-h-48 space-y-2 overflow-y-auto text-xs">
            {users.map((u) => (
              <article key={u.id} className="rounded bg-slate-950 p-2">
                {u.username} · {u.role}
              </article>
            ))}
          </div>
        </article>

        <article className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
          <h3 className="text-lg font-semibold">分享链接（公开/私有）</h3>
          <div className="mt-3 grid gap-2 md:grid-cols-4">
            <select className="rounded border border-slate-700 bg-slate-950 p-2 text-sm" value={shareForm.resource_type} onChange={(e) => setShareForm((v) => ({ ...v, resource_type: e.target.value }))}>
              <option value="workflow">任务</option>
              <option value="agent">智能体</option>
            </select>
            <input className="rounded border border-slate-700 bg-slate-950 p-2 text-sm" placeholder="资源ID" value={shareForm.resource_id} onChange={(e) => setShareForm((v) => ({ ...v, resource_id: e.target.value }))} />
            <select className="rounded border border-slate-700 bg-slate-950 p-2 text-sm" value={shareForm.visibility} onChange={(e) => setShareForm((v) => ({ ...v, visibility: e.target.value as "public" | "private" }))}>
              <option value="public">公开</option>
              <option value="private">私有</option>
            </select>
            <button className="rounded bg-sky-500 px-3 py-2 text-sm text-slate-950" onClick={addShare}>创建分享</button>
          </div>
          <div className="mt-3 max-h-48 space-y-2 overflow-y-auto text-xs">
            {shares.map((s) => (
              <article key={s.id} className="rounded bg-slate-950 p-2">
                {s.resource_type} / {s.resource_id} · {s.visibility} · 链接ID: {s.id}
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
        <h3 className="text-lg font-semibold">社区模板库</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-5">
          <input className="rounded border border-slate-700 bg-slate-950 p-2 text-sm" placeholder="模板名" value={tplForm.name} onChange={(e) => setTplForm((v) => ({ ...v, name: e.target.value }))} />
          <input className="rounded border border-slate-700 bg-slate-950 p-2 text-sm" placeholder="描述" value={tplForm.description} onChange={(e) => setTplForm((v) => ({ ...v, description: e.target.value }))} />
          <input className="rounded border border-slate-700 bg-slate-950 p-2 text-sm" placeholder="作者" value={tplForm.author} onChange={(e) => setTplForm((v) => ({ ...v, author: e.target.value }))} />
          <input className="rounded border border-slate-700 bg-slate-950 p-2 text-sm" placeholder="类型" value={tplForm.template_type} onChange={(e) => setTplForm((v) => ({ ...v, template_type: e.target.value }))} />
          <button className="rounded bg-emerald-500 px-3 py-2 text-sm text-slate-950" onClick={uploadTemplate}>上传模板</button>
        </div>
        <textarea className="mt-2 h-24 w-full rounded border border-slate-700 bg-slate-950 p-2 text-xs" placeholder='模板内容 JSON，例如 {"name":"demo"}' value={tplForm.content} onChange={(e) => setTplForm((v) => ({ ...v, content: e.target.value }))} />
        <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
          {templates.map((t) => (
            <article key={t.id} className="rounded bg-slate-950 p-2 text-sm">
              <p>{t.name} · ⭐ {t.rating} · 下载 {t.downloads}</p>
              <p className="text-xs text-slate-400">{t.description}</p>
              <div className="mt-1 flex gap-2 text-xs">
                <button className="rounded bg-sky-500 px-2 py-1 text-slate-950" onClick={() => downloadTemplate(t.id)}>下载</button>
                <button className="rounded bg-amber-500 px-2 py-1 text-slate-950" onClick={() => rateTemplate(t.id, 5)}>五星</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

