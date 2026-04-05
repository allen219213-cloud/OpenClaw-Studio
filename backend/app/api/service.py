from fastapi import APIRouter

from app.schemas.common import ApiResponse
from app.state import container

router = APIRouter(prefix="/api/v1/service", tags=["service"])


@router.get("/status")
async def status() -> dict:
    return container.openclaw_service.status()


@router.post("/{action}", response_model=ApiResponse)
async def action(action: str) -> ApiResponse:
    cfg = container.settings_service.load()
    workdir = cfg.data_dir

    if action == "start":
        ok, msg = container.openclaw_service.start(cfg.openclaw_start_command, workdir)
    elif action == "stop":
        ok, msg = container.openclaw_service.stop()
    elif action == "restart":
        ok, msg = container.openclaw_service.restart(cfg.openclaw_start_command, workdir)
    else:
        return ApiResponse(success=False, message="不支持的操作类型。")

    task = container.task_service.create("service-action", f"服务操作: {action}")
    container.task_service.update(task.id, "completed" if ok else "failed", msg)
    await container.status_service.broadcast(msg, "success" if ok else "error")
    return ApiResponse(success=ok, message=msg)
