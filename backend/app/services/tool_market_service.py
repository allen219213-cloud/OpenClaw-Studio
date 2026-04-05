from __future__ import annotations

import json
from datetime import datetime, timezone
from threading import Lock
from uuid import uuid4

from app.core.config import settings


OFFICIAL_TOOLS = [
    {"name": "web-search", "category": "official", "description": "网络搜索工具"},
    {"name": "browser", "category": "official", "description": "网页浏览工具"},
    {"name": "code-exec", "category": "official", "description": "代码执行工具"},
    {"name": "file-system", "category": "official", "description": "文件系统工具"},
    {"name": "sql-query", "category": "official", "description": "SQL 查询工具"},
    {"name": "http-client", "category": "official", "description": "HTTP 请求工具"},
    {"name": "image-gen", "category": "official", "description": "图像生成工具"},
    {"name": "pdf-reader", "category": "official", "description": "PDF 解析工具"},
]


class ToolMarketService:
    def __init__(self) -> None:
        self._tools_path = settings.runtime_dir / "tools_market.json"
        self._reviews_path = settings.runtime_dir / "tool_reviews.json"
        self._lock = Lock()

    def _read_json(self, path, default):
        if not path.exists():
            path.write_text(json.dumps(default, ensure_ascii=False, indent=2), encoding="utf-8")
            return default
        return json.loads(path.read_text(encoding="utf-8"))

    def _write_json(self, path, data) -> None:
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    def list_tools(self, query: str = "") -> list[dict]:
        with self._lock:
            items = self._read_json(self._tools_path, OFFICIAL_TOOLS.copy())
            reviews = self._read_json(self._reviews_path, [])
        q = query.strip().lower()
        filtered = [item for item in items if not q or q in item["name"].lower() or q in item.get("description", "").lower()]
        result = []
        for item in filtered:
            rs = [r for r in reviews if r["tool_name"] == item["name"]]
            avg = round(sum(r["rating"] for r in rs) / len(rs), 2) if rs else 0
            result.append({**item, "rating": avg, "reviews": len(rs)})
        return result

    def install_third_party(self, payload: dict) -> dict:
        with self._lock:
            items = self._read_json(self._tools_path, OFFICIAL_TOOLS.copy())
            now = datetime.now(timezone.utc).isoformat()
            item = {
                "name": payload["name"],
                "category": "third-party",
                "description": payload.get("description", ""),
                "repo": payload.get("repo", ""),
                "version": payload.get("version", "latest"),
                "config_schema": payload.get("config_schema", {}),
                "installed_at": now,
            }
            items.append(item)
            self._write_json(self._tools_path, items)
            return item

    def add_review(self, payload: dict) -> dict:
        with self._lock:
            reviews = self._read_json(self._reviews_path, [])
            item = {
                "id": str(uuid4()),
                "tool_name": payload["tool_name"],
                "user_id": payload["user_id"],
                "rating": payload["rating"],
                "comment": payload.get("comment", ""),
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            reviews.append(item)
            self._write_json(self._reviews_path, reviews)
            return item

    def list_reviews(self, tool_name: str) -> list[dict]:
        with self._lock:
            reviews = self._read_json(self._reviews_path, [])
        return [r for r in reviews if r["tool_name"] == tool_name]

