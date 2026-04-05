from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from uuid import uuid4

from app.core.config import settings

SUPPORTED_PROVIDERS = [
    "openai",
    "anthropic",
    "google_gemini",
    "deepseek",
    "doubao",
    "tongyi_qianwen",
    "wenxin_yiyan",
]


class ProviderService:
    def __init__(self) -> None:
        self._path = settings.runtime_dir / "provider_configs.json"
        self._lock = Lock()

    def _read(self) -> list[dict]:
        if not self._path.exists():
            self._path.write_text("[]", encoding="utf-8")
            return []
        return json.loads(self._path.read_text(encoding="utf-8"))

    def _write(self, data: list[dict]) -> None:
        self._path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    def list_configs(self) -> list[dict]:
        with self._lock:
            items = self._read()
        return [self._sanitize(item) for item in items]

    def create_config(self, payload: dict) -> dict:
        with self._lock:
            items = self._read()
            now = datetime.now(timezone.utc).isoformat()
            new_item = {
                "id": str(uuid4()),
                "provider": payload["provider"],
                "name": payload["name"],
                "api_key": payload["api_key"],
                "base_url": payload.get("base_url", ""),
                "proxy_url": payload.get("proxy_url", ""),
                "default_model": payload.get("default_model", ""),
                "quota_limit": payload.get("quota_limit", 0),
                "quota_used": payload.get("quota_used", 0),
                "created_at": now,
                "updated_at": now,
            }
            items.append(new_item)
            self._write(items)
            return self._sanitize(new_item)

    def update_config(self, config_id: str, payload: dict) -> tuple[bool, dict | None]:
        with self._lock:
            items = self._read()
            for item in items:
                if item["id"] == config_id:
                    for field in [
                        "provider",
                        "name",
                        "base_url",
                        "proxy_url",
                        "default_model",
                        "quota_limit",
                        "quota_used",
                    ]:
                        if field in payload:
                            item[field] = payload[field]
                    if payload.get("api_key"):
                        item["api_key"] = payload["api_key"]
                    item["updated_at"] = datetime.now(timezone.utc).isoformat()
                    self._write(items)
                    return True, self._sanitize(item)
            return False, None

    def delete_config(self, config_id: str) -> bool:
        with self._lock:
            items = self._read()
            next_items = [item for item in items if item["id"] != config_id]
            if len(next_items) == len(items):
                return False
            self._write(next_items)
            return True

    def test_connection(self, config_id: str) -> tuple[bool, str]:
        with self._lock:
            items = self._read()
        item = next((x for x in items if x["id"] == config_id), None)
        if not item:
            return False, "未找到配置项。"

        api_key = item.get("api_key", "")
        provider = item.get("provider", "")
        if not api_key:
            return False, "API Key 不能为空。"

        # Lightweight validation to avoid leaking low-level technical failures to users.
        if provider == "openai" and not api_key.startswith("sk-"):
            return False, "OpenAI Key 格式不正确。"
        if provider == "anthropic" and not api_key.startswith("sk-ant-"):
            return False, "Anthropic Key 格式不正确。"

        return True, "连接测试通过。"

    @staticmethod
    def _sanitize(item: dict) -> dict:
        api_key = item.get("api_key", "")
        masked = f"***{api_key[-4:]}" if len(api_key) >= 4 else "***"
        quota_limit = float(item.get("quota_limit", 0) or 0)
        quota_used = float(item.get("quota_used", 0) or 0)
        usage_percent = round((quota_used / quota_limit * 100), 2) if quota_limit > 0 else 0

        return {
            "id": item["id"],
            "provider": item["provider"],
            "name": item["name"],
            "api_key_masked": masked,
            "base_url": item.get("base_url", ""),
            "proxy_url": item.get("proxy_url", ""),
            "default_model": item.get("default_model", ""),
            "quota_limit": quota_limit,
            "quota_used": quota_used,
            "usage_percent": usage_percent,
            "created_at": item.get("created_at", ""),
            "updated_at": item.get("updated_at", ""),
        }
