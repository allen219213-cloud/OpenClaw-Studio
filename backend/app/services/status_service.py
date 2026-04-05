from __future__ import annotations

from datetime import datetime, timezone
from threading import Lock

from fastapi import WebSocket


class StatusBroadcastService:
    def __init__(self) -> None:
        self._connections: list[WebSocket] = []
        self._lock = Lock()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        with self._lock:
            self._connections.append(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        with self._lock:
            self._connections = [conn for conn in self._connections if conn != websocket]

    async def send_status(self, websocket: WebSocket, message: str, level: str = "info") -> None:
        await websocket.send_json(
            {
                "level": level,
                "message": message,
                "at": datetime.now(timezone.utc).isoformat(),
            }
        )

    async def broadcast(self, message: str, level: str = "info") -> None:
        payload = {
            "level": level,
            "message": message,
            "at": datetime.now(timezone.utc).isoformat(),
        }
        with self._lock:
            connections = list(self._connections)

        stale: list[WebSocket] = []
        for conn in connections:
            try:
                await conn.send_json(payload)
            except Exception:
                stale.append(conn)

        if stale:
            with self._lock:
                self._connections = [conn for conn in self._connections if conn not in stale]
