from datetime import datetime, timezone

from fastapi import WebSocket


class StatusBroadcastService:
    async def send_status(self, websocket: WebSocket, message: str, level: str = "info") -> None:
        await websocket.send_json(
            {
                "level": level,
                "message": message,
                "at": datetime.now(timezone.utc).isoformat(),
            }
        )
