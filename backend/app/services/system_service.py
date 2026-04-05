from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

import psutil


class SystemService:
    @staticmethod
    def collect_metrics() -> dict[str, float]:
        disk_root = Path.cwd().anchor or "/"
        return {
            "cpu_percent": round(psutil.cpu_percent(interval=0.2), 2),
            "memory_percent": round(psutil.virtual_memory().percent, 2),
            "disk_percent": round(psutil.disk_usage(disk_root).percent, 2),
        }

    @staticmethod
    def timestamp() -> str:
        return datetime.now(timezone.utc).isoformat()
