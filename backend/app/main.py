from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.core.config import settings
from app.services.status_service import StatusBroadcastService

status_service = StatusBroadcastService()


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Placeholder for startup/shutdown hooks.
    yield


app = FastAPI(title=settings.app_name, debug=settings.debug, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)


@app.websocket("/ws/status")
async def websocket_status(websocket: WebSocket) -> None:
    await websocket.accept()
    await status_service.send_status(websocket, "Connected to lobster-claw status channel", "success")

    try:
        while True:
            payload = await websocket.receive_text()
            await status_service.send_status(websocket, f"Received: {payload}", "info")
    except WebSocketDisconnect:
        return
