from __future__ import annotations

import json
import secrets
from datetime import datetime, timezone
from threading import Lock
from uuid import uuid4

from app.core.config import settings


class UserService:
    def __init__(self) -> None:
        self._path = settings.runtime_dir / "users.json"
        self._session_path = settings.runtime_dir / "sessions.json"
        self._lock = Lock()
        self._ensure_default_admin()

    def _read_json(self, path, default):
        if not path.exists():
            path.write_text(json.dumps(default, ensure_ascii=False, indent=2), encoding="utf-8")
            return default
        return json.loads(path.read_text(encoding="utf-8"))

    def _write_json(self, path, data) -> None:
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    def _ensure_default_admin(self) -> None:
        with self._lock:
            users = self._read_json(self._path, [])
            if not users:
                users.append(
                    {
                        "id": str(uuid4()),
                        "username": "admin",
                        "password": "admin123",
                        "role": "admin",
                        "created_at": datetime.now(timezone.utc).isoformat(),
                    }
                )
                self._write_json(self._path, users)

    def list_users(self) -> list[dict]:
        with self._lock:
            users = self._read_json(self._path, [])
        return [{k: v for k, v in u.items() if k != "password"} for u in users]

    def create_user(self, username: str, password: str, role: str) -> tuple[bool, str]:
        with self._lock:
            users = self._read_json(self._path, [])
            if any(u["username"] == username for u in users):
                return False, "用户名已存在。"
            users.append(
                {
                    "id": str(uuid4()),
                    "username": username,
                    "password": password,
                    "role": role,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }
            )
            self._write_json(self._path, users)
        return True, "用户创建成功。"

    def login(self, username: str, password: str) -> tuple[bool, dict | None, str]:
        with self._lock:
            users = self._read_json(self._path, [])
            sessions = self._read_json(self._session_path, [])
            user = next((u for u in users if u["username"] == username and u["password"] == password), None)
            if not user:
                return False, None, "用户名或密码错误。"
            token = secrets.token_urlsafe(24)
            sessions.append(
                {
                    "token": token,
                    "user_id": user["id"],
                    "username": user["username"],
                    "role": user["role"],
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }
            )
            self._write_json(self._session_path, sessions)
            return True, {"token": token, "role": user["role"], "username": user["username"]}, "登录成功。"

    def verify_token(self, token: str) -> dict | None:
        with self._lock:
            sessions = self._read_json(self._session_path, [])
        return next((s for s in sessions if s["token"] == token), None)

