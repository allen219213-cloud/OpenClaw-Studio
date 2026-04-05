from __future__ import annotations

import json
from pathlib import Path
from threading import Lock

from app.core.config import settings
from app.schemas.common import SystemSettings


class SettingsService:
    def __init__(self) -> None:
        self._lock = Lock()
        self._config_path = settings.runtime_dir / "system_settings.json"

    def load(self) -> SystemSettings:
        with self._lock:
            if not self._config_path.exists():
                default = SystemSettings()
                self._write(default)
                return default
            data = json.loads(self._config_path.read_text(encoding="utf-8"))
            return SystemSettings(**data)

    def save(self, payload: SystemSettings) -> SystemSettings:
        with self._lock:
            self._write(payload)
        return payload

    def _write(self, payload: SystemSettings) -> None:
        self._config_path.parent.mkdir(parents=True, exist_ok=True)
        self._config_path.write_text(payload.model_dump_json(indent=2), encoding="utf-8")
        Path(payload.data_dir).mkdir(parents=True, exist_ok=True)
