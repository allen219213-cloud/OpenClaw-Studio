from __future__ import annotations

import json
from datetime import datetime, timezone
from threading import Lock
from uuid import uuid4

import yaml

from app.core.config import settings


class WorkflowService:
    def __init__(self) -> None:
        self._path = settings.runtime_dir / "workflows.json"
        self._lock = Lock()

    def _read(self) -> list[dict]:
        if not self._path.exists():
            self._path.write_text("[]", encoding="utf-8")
            return []
        return json.loads(self._path.read_text(encoding="utf-8"))

    def _write(self, data: list[dict]) -> None:
        self._path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    def list(self, query: str = "", category: str = "") -> list[dict]:
        with self._lock:
            items = self._read()
        query = query.strip().lower()
        category = category.strip().lower()
        return [
            item
            for item in items
            if (not query or query in item["name"].lower() or query in item.get("description", "").lower())
            and (not category or category == item.get("category", "").lower())
        ]

    def get(self, workflow_id: str) -> dict | None:
        with self._lock:
            items = self._read()
        return next((item for item in items if item["id"] == workflow_id), None)

    def create(self, payload: dict) -> dict:
        with self._lock:
            items = self._read()
            now = datetime.now(timezone.utc).isoformat()
            item = {
                "id": str(uuid4()),
                "name": payload["name"],
                "description": payload.get("description", ""),
                "category": payload.get("category", "general"),
                "tags": payload.get("tags", []),
                "graph": payload.get("graph", {"nodes": [], "edges": []}),
                "variables": payload.get("variables", {}),
                "compatibility_mode": payload.get("compatibility_mode", "openclaw-v1"),
                "openclaw_version": "1.0",
                "created_at": now,
                "updated_at": now,
            }
            items.append(item)
            self._write(items)
            return item

    def update(self, workflow_id: str, payload: dict) -> tuple[bool, dict | None]:
        with self._lock:
            items = self._read()
            for item in items:
                if item["id"] == workflow_id:
                    for field in ["name", "description", "category", "tags", "graph", "variables", "compatibility_mode"]:
                        item[field] = payload.get(field, item[field])
                    item["updated_at"] = datetime.now(timezone.utc).isoformat()
                    self._write(items)
                    return True, item
        return False, None

    def delete(self, workflow_id: str) -> bool:
        with self._lock:
            items = self._read()
            next_items = [item for item in items if item["id"] != workflow_id]
            if len(next_items) == len(items):
                return False
            self._write(next_items)
        return True

    def export(self, workflow_id: str, fmt: str) -> tuple[bool, str, str]:
        item = self.get(workflow_id)
        if not item:
            return False, "", "未找到任务。"
        if fmt == "json":
            return True, json.dumps(item, ensure_ascii=False, indent=2), "导出成功。"
        if fmt == "yaml":
            return True, yaml.safe_dump(item, allow_unicode=True, sort_keys=False), "导出成功。"
        return False, "", "仅支持 JSON 或 YAML。"

    def import_data(self, fmt: str, content: str) -> tuple[bool, dict | None, str]:
        try:
            raw = json.loads(content) if fmt == "json" else yaml.safe_load(content)
            if not isinstance(raw, dict):
                return False, None, "导入格式不正确。"
        except Exception:
            return False, None, "导入内容解析失败。"

        if not raw.get("name"):
            return False, None, "任务名称不能为空。"
        if "graph" not in raw:
            return False, None, "缺少任务图配置。"

        item = self.create(
            {
                "name": raw.get("name"),
                "description": raw.get("description", ""),
                "category": raw.get("category", "general"),
                "tags": raw.get("tags", []),
                "graph": raw.get("graph", {"nodes": [], "edges": []}),
                "variables": raw.get("variables", {}),
                "compatibility_mode": raw.get("compatibility_mode", "openclaw-v1"),
            }
        )
        return True, item, "导入成功。"

    def templates(self) -> list[dict]:
        # 20+ templates for frequent scenarios.
        base = [
            ("code-dev", "代码开发流水线", "code"),
            ("code-review", "代码评审流程", "code"),
            ("bug-fix", "缺陷修复流程", "code"),
            ("unit-test", "自动化测试流程", "code"),
            ("data-clean", "数据清洗任务", "data"),
            ("data-analysis", "数据分析报告", "data"),
            ("etl", "ETL 批处理", "data"),
            ("dashboard", "指标仪表盘生成", "data"),
            ("content-plan", "内容选题策划", "content"),
            ("content-write", "内容写作发布", "content"),
            ("seo-article", "SEO 文章生成", "content"),
            ("social-media", "社媒运营流程", "content"),
            ("research-report", "研究报告生成", "research"),
            ("market-research", "市场调研", "research"),
            ("competitor-analysis", "竞品分析", "research"),
            ("doc-translate", "文档翻译", "office"),
            ("meeting-summary", "会议纪要整理", "office"),
            ("sales-funnel", "销售线索跟进", "business"),
            ("customer-support", "客服工单处理", "business"),
            ("hr-screening", "简历筛选流程", "business"),
            ("qa-regression", "回归测试流程", "qa"),
            ("security-scan", "安全扫描流程", "qa"),
        ]
        templates: list[dict] = []
        for idx, (tid, name, category) in enumerate(base):
            templates.append(
                {
                    "id": tid,
                    "name": name,
                    "category": category,
                    "workflow": {
                        "name": name,
                        "description": f"{name} 模板",
                        "category": category,
                        "tags": [category, "template"],
                        "graph": {
                            "nodes": [
                                {"id": "start", "type": "start", "position": {"x": 50, "y": 100}, "data": {"label": "开始"}},
                                {
                                    "id": "agent",
                                    "type": "agent",
                                    "position": {"x": 280, "y": 100 + (idx % 3) * 20},
                                    "data": {"label": "智能体处理", "agent_id": ""},
                                },
                                {"id": "end", "type": "end", "position": {"x": 520, "y": 100}, "data": {"label": "结束"}},
                            ],
                            "edges": [
                                {"id": "e1", "source": "start", "target": "agent", "label": "next", "data": {}},
                                {"id": "e2", "source": "agent", "target": "end", "label": "done", "data": {}},
                            ],
                        },
                        "variables": {},
                        "compatibility_mode": "openclaw-v1",
                    },
                }
            )
        return templates

