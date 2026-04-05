from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.backup import router as backup_router
from app.api.health import router as health_router
from app.api.init import router as init_router
from app.api.service import router as service_router
from app.api.settings import router as settings_router
from app.api.system import router as system_router
from app.core.config import settings
from app.schemas.common import ErrorResponse
from app.state import container


@asynccontextmanager
async def lifespan(_: FastAPI):
    container.settings_service.load()
    yield


app = FastAPI(title=settings.app_name, debug=settings.debug, lifespan=lifespan)


@app.exception_handler(Exception)
async def handle_general_exception(_: Request, __: Exception) -> JSONResponse:
    payload = ErrorResponse(message="操作失败，请稍后重试。")
    return JSONResponse(status_code=500, content=payload.model_dump())


@app.exception_handler(RequestValidationError)
async def handle_validation_exception(_: Request, __: RequestValidationError) -> JSONResponse:
    payload = ErrorResponse(message="输入参数有误，请检查后重试。")
    return JSONResponse(status_code=422, content=payload.model_dump())


cfg = container.settings_service.load()
app.add_middleware(
    CORSMiddleware,
    allow_origins=cfg.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(system_router)
app.include_router(service_router)
app.include_router(settings_router)
app.include_router(backup_router)
app.include_router(init_router)


@app.websocket("/ws/status")
async def websocket_status(websocket: WebSocket) -> None:
    await container.status_service.connect(websocket)
    await container.status_service.send_status(websocket, "已连接实时状态通道", "success")

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        container.status_service.disconnect(websocket)
