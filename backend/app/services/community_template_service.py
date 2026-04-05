from __future__ import annotations

import json
from datetime import datetime, timezone
from threading import Lock
from uuid import uuid4

from app.core.config import settings


class CommunityTemplateService:
    def __init__(self) -> None:
        self._path = settings.runtime_dir / "community_templates.json"
        self._lock = Lock()

    def _read(self) -> list[dict]:
        if not self._path.exists():
            self._path.write_text("[]", encoding="utf-8")
            return []
        return json.loads(self._path.read_text(encoding="utf-8"))

    def _write(self, data: list[dict]) -> None:
        self._path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    def list(self, query: str = "") -> list[dict]:
        with self._lock:
            items = self._read()
        q = query.strip().lower()
        return [i for i in items if not q or q in i["name"].lower() or q in i.get("description", "").lower()]

    def upload(self, payload: dict) -> dict:
        with self._lock:
            items = self._read()
            item = {
                "id": str(uuid4()),
                "name": payload["name"],
                "description": payload.get("description", ""),
                "template_type": payload.get("template_type", "workflow"),
                "content": payload.get("content", {}),
                "author": payload.get("author", "anonymous"),
                "downloads": 0,
                "rating": 0,
                "votes": 0,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            items.append(item)
            self._write(items)
            return item

    def download(self, template_id: str) -> tuple[bool, dict | None]:
        with self._lock:
            items = self._read()
            for item in items:
                if item["id"] == template_id:
                    item["downloads"] += 1
                    self._write(items)
                    return True, item
        return False, None

    def rate(self, template_id: str, score: int) -> tuple[bool, str]:
        with self._lock:
            items = self._read()
            for item in items:
                if item["id"] == template_id:
                    total = item["rating"] * item["votes"] + score
                    item["votes"] += 1
                    item["rating"] = round(total / item["votes"], 2)
                    self._write(items)
                    return True, "评分成功。"
        return False, "模板不存在。"

