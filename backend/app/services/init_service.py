from __future__ import annotations

import subprocess
import sys
import threading
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from app.services.status_service import StatusBroadcastService
from app.services.task_service import TaskService


@dataclass
class InitState:
    in_progress: bool = False
    progress: int = 0
    current_step: str = "idle"
    message: str = "尚未开始"
    started_at: str | None = None
    finished_at: str | None = None


class InitializationService:
    def __init__(self, task_service: TaskService, status_service: StatusBroadcastService) -> None:
        self._task_service = task_service
        self._status_service = status_service
        self._state = InitState()
        self._lock = threading.Lock()

    def status(self) -> InitState:
        with self._lock:
            return InitState(**self._state.__dict__)

    def start(self, install_source: str, runtime_dir: Path) -> tuple[bool, str]:
        with self._lock:
            if self._state.in_progress:
                return False, "初始化正在进行中，请稍候。"
            self._state = InitState(
                in_progress=True,
                progress=1,
                current_step="prepare",
                message="正在准备安装环境",
                started_at=datetime.now(timezone.utc).isoformat(),
                finished_at=None,
            )

        threading.Thread(
            target=self._run_install,
            args=(install_source, runtime_dir),
            daemon=True,
        ).start()
        return True, "初始化任务已启动。"

    def _emit(self, message: str, level: str = "info") -> None:
        import asyncio

        asyncio.run(self._status_service.broadcast(message, level))

    def _update_state(self, **kwargs) -> None:
        with self._lock:
            for key, value in kwargs.items():
                setattr(self._state, key, value)

    def _run_install(self, install_source: str, runtime_dir: Path) -> None:
        task = self._task_service.create("system-init", "系统初始化开始")

        try:
            venv_dir = runtime_dir / "openclaw-venv"
            self._emit("开始初始化 OpenClaw 环境")

            self._update_state(progress=15, current_step="venv", message="正在创建 Python 虚拟环境")
            if not venv_dir.exists():
                subprocess.run([sys.executable, "-m", "venv", str(venv_dir)], check=True)
            self._emit("Python 虚拟环境准备完成", "success")

            pip_exe = venv_dir / ("Scripts/pip.exe" if sys.platform.startswith("win") else "bin/pip")
            py_exe = venv_dir / ("Scripts/python.exe" if sys.platform.startswith("win") else "bin/python")

            self._update_state(progress=40, current_step="pip", message="正在更新安装工具")
            subprocess.run([str(py_exe), "-m", "pip", "install", "--upgrade", "pip", "setuptools", "wheel"], check=True)
            self._emit("安装工具更新完成", "success")

            self._update_state(progress=70, current_step="core", message="正在安装 OpenClaw 核心")
            if install_source:
                subprocess.run([str(pip_exe), "install", install_source], check=True)
            else:
                subprocess.run([str(pip_exe), "install", "openclaw"], check=True)
            self._emit("OpenClaw 核心安装完成", "success")

            self._update_state(progress=100, current_step="done", message="初始化完成", finished_at=datetime.now(timezone.utc).isoformat(), in_progress=False)
            self._task_service.update(task.id, "completed", "系统初始化完成")
            self._emit("系统初始化完成", "success")
        except Exception:
            self._update_state(
                in_progress=False,
                current_step="failed",
                message="初始化失败，请检查安装源或网络设置后重试。",
                finished_at=datetime.now(timezone.utc).isoformat(),
            )
            self._task_service.update(task.id, "failed", "系统初始化失败")
            self._emit("系统初始化失败，请检查设置后重试。", "error")
