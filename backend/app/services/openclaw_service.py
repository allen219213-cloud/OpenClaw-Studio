from __future__ import annotations

import shlex
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock


class OpenClawService:
    def __init__(self) -> None:
        self._process: subprocess.Popen[str] | None = None
        self._lock = Lock()
        self._updated_at = datetime.now(timezone.utc).isoformat()

    def status(self) -> dict:
        with self._lock:
            if self._process and self._process.poll() is None:
                return {
                    "name": "openclaw",
                    "status": "running",
                    "pid": self._process.pid,
                    "updated_at": self._updated_at,
                }
            return {
                "name": "openclaw",
                "status": "stopped",
                "pid": None,
                "updated_at": self._updated_at,
            }

    def start(self, command: str, workdir: str) -> tuple[bool, str]:
        with self._lock:
            if self._process and self._process.poll() is None:
                return True, "OpenClaw 服务已经在运行。"

            try:
                args = shlex.split(command)
                Path(workdir).mkdir(parents=True, exist_ok=True)
                self._process = subprocess.Popen(
                    args,
                    cwd=workdir,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    text=True,
                )
                self._updated_at = datetime.now(timezone.utc).isoformat()
                return True, "OpenClaw 服务启动成功。"
            except Exception:
                self._updated_at = datetime.now(timezone.utc).isoformat()
                return False, "服务启动失败，请检查安装状态和启动命令。"

    def stop(self) -> tuple[bool, str]:
        with self._lock:
            if not self._process or self._process.poll() is not None:
                return True, "OpenClaw 服务已停止。"

            self._process.terminate()
            try:
                self._process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                self._process.kill()
            self._updated_at = datetime.now(timezone.utc).isoformat()
            return True, "OpenClaw 服务已停止。"

    def restart(self, command: str, workdir: str) -> tuple[bool, str]:
        self.stop()
        return self.start(command=command, workdir=workdir)
