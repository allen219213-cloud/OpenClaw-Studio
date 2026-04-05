from fastapi import APIRouter

from app.core.config import settings
from app.schemas.common import ApiResponse, InitStatus
from app.state import container

router = APIRouter(prefix="/api/v1/init", tags=["initializer"])


@router.get("/status", response_model=InitStatus)
async def init_status() -> InitStatus:
    state = container.init_service.status()
    return InitStatus(**state.__dict__)


@router.post("/start", response_model=ApiResponse)
async def init_start() -> ApiResponse:
    cfg = container.settings_service.load()
    ok, msg = container.init_service.start(cfg.openclaw_install_source, settings.runtime_dir)
    if ok:
        await container.status_service.broadcast(msg, "success")
    else:
        await container.status_service.broadcast(msg, "error")
    return ApiResponse(success=ok, message=msg)
