from __future__ import annotations

import json
import secrets
from datetime import datetime, timezone
from threading import Lock

from app.core.config import settings


class ShareService:
    def __init__(self) -> None:
        self._path = settings.runtime_dir / "shares.json"
        self._lock = Lock()

    def _read(self) -> list[dict]:
        if not self._path.exists():
            self._path.write_text("[]", encoding="utf-8")
            return []
        return json.loads(self._path.read_text(encoding="utf-8"))

    def _write(self, data: list[dict]) -> None:
        self._path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    def create_share(self, payload: dict) -> dict:
        with self._lock:
            items = self._read()
            token = secrets.token_urlsafe(10)
            item = {
                "id": token,
                "resource_type": payload["resource_type"],
                "resource_id": payload["resource_id"],
                "visibility": payload.get("visibility", "private"),
                "owner": payload.get("owner", "unknown"),
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            items.append(item)
            self._write(items)
            return item

    def get_share(self, share_id: str) -> dict | None:
        with self._lock:
            items = self._read()
        return next((i for i in items if i["id"] == share_id), None)

    def list_public(self) -> list[dict]:
        with self._lock:
            items = self._read()
        return [i for i in items if i.get("visibility") == "public"]

