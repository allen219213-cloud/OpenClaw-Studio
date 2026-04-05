from __future__ import annotations

from collections import deque
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from threading import Lock
from uuid import uuid4


@dataclass
class TaskRecord:
    id: str
    name: str
    status: str
    message: str
    created_at: str
    updated_at: str


class TaskService:
    def __init__(self) -> None:
        self._tasks: deque[TaskRecord] = deque(maxlen=500)
        self._lock = Lock()

    def create(self, name: str, message: str = "任务已创建") -> TaskRecord:
        now = datetime.now(timezone.utc).isoformat()
        task = TaskRecord(
            id=str(uuid4()),
            name=name,
            status="running",
            message=message,
            created_at=now,
            updated_at=now,
        )
        with self._lock:
            self._tasks.appendleft(task)
        return task

    def update(self, task_id: str, status: str, message: str) -> None:
        now = datetime.now(timezone.utc).isoformat()
        with self._lock:
            for task in self._tasks:
                if task.id == task_id:
                    task.status = status
                    task.message = message
                    task.updated_at = now
                    break

    def recent(self, count: int = 5) -> list[dict]:
        with self._lock:
            return [asdict(item) for item in list(self._tasks)[:count]]

    def stats(self) -> dict[str, int]:
        with self._lock:
            tasks = list(self._tasks)
        return {
            "total": len(tasks),
            "running": sum(1 for t in tasks if t.status == "running"),
            "completed": sum(1 for t in tasks if t.status == "completed"),
            "failed": sum(1 for t in tasks if t.status == "failed"),
        }
