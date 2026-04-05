from __future__ import annotations

import json
from datetime import datetime, timezone
from threading import Lock
from uuid import uuid4

import yaml

from app.core.config import settings


class AgentService:
    def __init__(self) -> None:
        self._path = settings.runtime_dir / "agents.json"
        self._lock = Lock()

    def _read(self) -> list[dict]:
        if not self._path.exists():
            self._path.write_text("[]", encoding="utf-8")
            return []
        return json.loads(self._path.read_text(encoding="utf-8"))

    def _write(self, data: list[dict]) -> None:
        self._path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    def list_agents(self, query: str = "", model: str = "", tag: str = "") -> list[dict]:
        with self._lock:
            items = self._read()

        query = query.strip().lower()
        model = model.strip().lower()
        tag = tag.strip().lower()

        def matches(item: dict) -> bool:
            ok_query = not query or query in item["name"].lower() or query in item.get("description", "").lower()
            ok_model = not model or model in item.get("model_config", {}).get("model", "").lower()
            tags = [x.lower() for x in item.get("tags", [])]
            ok_tag = not tag or tag in tags
            return ok_query and ok_model and ok_tag

        return [item for item in items if matches(item)]

    def get_agent(self, agent_id: str) -> dict | None:
        with self._lock:
            items = self._read()
        return next((item for item in items if item["id"] == agent_id), None)

    def create_agent(self, payload: dict) -> dict:
        with self._lock:
            items = self._read()
            now = datetime.now(timezone.utc).isoformat()
            item = {
                "id": str(uuid4()),
                "name": payload["name"],
                "description": payload.get("description", ""),
                "avatar": payload.get("avatar", "🤖"),
                "system_prompt": payload.get("system_prompt", ""),
                "model_config": payload.get("model_config", {}),
                "tools": payload.get("tools", []),
                "memory": payload.get("memory", {}),
                "tags": payload.get("tags", []),
                "created_at": now,
                "updated_at": now,
            }
            items.append(item)
            self._write(items)
            return item

    def update_agent(self, agent_id: str, payload: dict) -> tuple[bool, dict | None]:
        with self._lock:
            items = self._read()
            for item in items:
                if item["id"] == agent_id:
                    for key in ["name", "description", "avatar", "system_prompt", "model_config", "tools", "memory", "tags"]:
                        if key in payload:
                            item[key] = payload[key]
                    item["updated_at"] = datetime.now(timezone.utc).isoformat()
                    self._write(items)
                    return True, item
        return False, None

    def delete_agent(self, agent_id: str) -> bool:
        with self._lock:
            items = self._read()
            next_items = [item for item in items if item["id"] != agent_id]
            if len(next_items) == len(items):
                return False
            self._write(next_items)
        return True

    def export_agent(self, agent_id: str, fmt: str) -> tuple[bool, str, str]:
        item = self.get_agent(agent_id)
        if not item:
            return False, "", "未找到智能体。"

        if fmt == "json":
            return True, json.dumps(item, ensure_ascii=False, indent=2), "导出成功。"
        if fmt == "yaml":
            return True, yaml.safe_dump(item, allow_unicode=True, sort_keys=False), "导出成功。"
        return False, "", "仅支持 JSON 或 YAML。"

    def import_agent(self, fmt: str, content: str) -> tuple[bool, dict | None, str]:
        try:
            raw = json.loads(content) if fmt == "json" else yaml.safe_load(content)
            if not isinstance(raw, dict):
                return False, None, "导入内容格式不正确。"
        except Exception:
            return False, None, "导入内容解析失败，请检查格式。"

        if not raw.get("name"):
            return False, None, "智能体名称不能为空。"

        payload = {
            "name": raw.get("name"),
            "description": raw.get("description", ""),
            "avatar": raw.get("avatar", "🤖"),
            "system_prompt": raw.get("system_prompt", ""),
            "model_config": raw.get("model_config", {}),
            "tools": raw.get("tools", []),
            "memory": raw.get("memory", {}),
            "tags": raw.get("tags", []),
        }
        item = self.create_agent(payload)
        return True, item, "导入成功。"
