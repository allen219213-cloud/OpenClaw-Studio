from __future__ import annotations

import asyncio
import threading
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import WebSocket
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas


class WorkflowExecutionService:
    def __init__(self) -> None:
        self._runs: dict[str, dict[str, Any]] = {}
        self._locks: dict[str, threading.Lock] = {}
        self._ws_connections: dict[str, list[WebSocket]] = {}
        self._ws_lock = threading.Lock()

    def _lock_for(self, workflow_id: str) -> threading.Lock:
        if workflow_id not in self._locks:
            self._locks[workflow_id] = threading.Lock()
        return self._locks[workflow_id]

    def get_run(self, workflow_id: str) -> dict[str, Any]:
        lock = self._lock_for(workflow_id)
        with lock:
            if workflow_id not in self._runs:
                self._runs[workflow_id] = {
                    "status": "idle",
                    "progress": 0,
                    "logs": [],
                    "conversation": [],
                    "result": "",
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }
            return dict(self._runs[workflow_id])

    async def connect_logs(self, workflow_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        with self._ws_lock:
            self._ws_connections.setdefault(workflow_id, []).append(websocket)

    def disconnect_logs(self, workflow_id: str, websocket: WebSocket) -> None:
        with self._ws_lock:
            current = self._ws_connections.get(workflow_id, [])
            self._ws_connections[workflow_id] = [item for item in current if item != websocket]

    async def _broadcast(self, workflow_id: str, payload: dict) -> None:
        with self._ws_lock:
            targets = list(self._ws_connections.get(workflow_id, []))
        stale: list[WebSocket] = []
        for ws in targets:
            try:
                await ws.send_json(payload)
            except Exception:
                stale.append(ws)
        if stale:
            with self._ws_lock:
                current = self._ws_connections.get(workflow_id, [])
                self._ws_connections[workflow_id] = [item for item in current if item not in stale]

    def _push_log_sync(self, workflow_id: str, level: str, message: str, agent: str = "") -> None:
        lock = self._lock_for(workflow_id)
        now = datetime.now(timezone.utc).isoformat()
        payload = {"level": level, "message": message, "at": now, "agent": agent}
        with lock:
            run = self.get_run(workflow_id)
            logs = run["logs"] + [payload]
            conv = run["conversation"]
            if agent:
                conv = conv + [{"agent": agent, "thought": message, "at": now}]
            run["logs"] = logs[-500:]
            run["conversation"] = conv[-200:]
            run["updated_at"] = now
            self._runs[workflow_id] = run
        asyncio.run(self._broadcast(workflow_id, payload))

    def execute(self, workflow_id: str, workflow: dict) -> tuple[bool, str]:
        lock = self._lock_for(workflow_id)
        with lock:
            run = self.get_run(workflow_id)
            if run["status"] == "running":
                return False, "任务已在执行中。"
            run["status"] = "running"
            run["progress"] = 1
            run["result"] = ""
            run["logs"] = []
            run["conversation"] = []
            self._runs[workflow_id] = run
        threading.Thread(target=self._run_job, args=(workflow_id, workflow), daemon=True).start()
        return True, "任务已启动。"

    def _run_job(self, workflow_id: str, workflow: dict) -> None:
        nodes = workflow.get("graph", {}).get("nodes", [])
        steps = max(len(nodes), 1)
        summary_parts: list[str] = []
        for idx, node in enumerate(nodes):
            run = self.get_run(workflow_id)
            if run["status"] == "stopped":
                self._push_log_sync(workflow_id, "error", "任务已停止。")
                return
            while run["status"] == "paused":
                time.sleep(0.3)
                run = self.get_run(workflow_id)

            label = node.get("data", {}).get("label", node.get("type", "node"))
            ntype = node.get("type", "agent")
            msg = f"执行节点 {label} ({ntype})"
            agent_name = "agent-runner" if ntype == "agent" else ""
            self._push_log_sync(workflow_id, "info", msg, agent_name)
            time.sleep(0.8)
            progress = int(((idx + 1) / steps) * 100)
            lock = self._lock_for(workflow_id)
            with lock:
                run = self.get_run(workflow_id)
                run["progress"] = progress
                run["updated_at"] = datetime.now(timezone.utc).isoformat()
                self._runs[workflow_id] = run
            summary_parts.append(f"- {label}: completed")

        lock = self._lock_for(workflow_id)
        with lock:
            run = self.get_run(workflow_id)
            run["status"] = "completed"
            run["progress"] = 100
            run["result"] = "\n".join(summary_parts) or "- no-op"
            run["updated_at"] = datetime.now(timezone.utc).isoformat()
            self._runs[workflow_id] = run
        self._push_log_sync(workflow_id, "success", "任务执行完成。")

    def pause(self, workflow_id: str) -> tuple[bool, str]:
        lock = self._lock_for(workflow_id)
        with lock:
            run = self.get_run(workflow_id)
            if run["status"] != "running":
                return False, "当前任务不在运行状态。"
            run["status"] = "paused"
            self._runs[workflow_id] = run
        self._push_log_sync(workflow_id, "info", "任务已暂停。")
        return True, "任务已暂停。"

    def resume(self, workflow_id: str) -> tuple[bool, str]:
        lock = self._lock_for(workflow_id)
        with lock:
            run = self.get_run(workflow_id)
            if run["status"] != "paused":
                return False, "当前任务未暂停。"
            run["status"] = "running"
            self._runs[workflow_id] = run
        self._push_log_sync(workflow_id, "info", "任务已继续执行。")
        return True, "任务已继续执行。"

    def stop(self, workflow_id: str) -> tuple[bool, str]:
        lock = self._lock_for(workflow_id)
        with lock:
            run = self.get_run(workflow_id)
            if run["status"] not in {"running", "paused"}:
                return False, "当前任务不可停止。"
            run["status"] = "stopped"
            run["updated_at"] = datetime.now(timezone.utc).isoformat()
            self._runs[workflow_id] = run
        self._push_log_sync(workflow_id, "error", "任务停止指令已发送。")
        return True, "任务已停止。"

    def retry(self, workflow_id: str, workflow: dict) -> tuple[bool, str]:
        return self.execute(workflow_id, workflow)

    def export_result(self, workflow_id: str, fmt: str, out_dir: Path) -> tuple[bool, str, str]:
        run = self.get_run(workflow_id)
        if run["status"] not in {"completed", "stopped"}:
            return False, "", "任务尚未完成，无法导出。"
        out_dir.mkdir(parents=True, exist_ok=True)
        ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        result = run.get("result", "")
        if fmt == "markdown":
            p = out_dir / f"workflow_result_{workflow_id}_{ts}.md"
            p.write_text(f"# Workflow Result\n\n{result}\n", encoding="utf-8")
            return True, str(p), "导出 Markdown 成功。"
        if fmt == "html":
            p = out_dir / f"workflow_result_{workflow_id}_{ts}.html"
            p.write_text(f"<html><body><h1>Workflow Result</h1><pre>{result}</pre></body></html>", encoding="utf-8")
            return True, str(p), "导出 HTML 成功。"
        if fmt == "pdf":
            p = out_dir / f"workflow_result_{workflow_id}_{ts}.pdf"
            cv = canvas.Canvas(str(p), pagesize=A4)
            y = 800
            cv.setFont("Helvetica", 12)
            for line in (["Workflow Result"] + result.splitlines()):
                cv.drawString(40, y, line[:100])
                y -= 18
                if y < 40:
                    cv.showPage()
                    y = 800
            cv.save()
            return True, str(p), "导出 PDF 成功。"
        return False, "", "仅支持 markdown/html/pdf。"

