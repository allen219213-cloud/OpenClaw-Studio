from fastapi import APIRouter

from app.schemas.common import ApiResponse, RestoreRequest
from app.state import container

router = APIRouter(prefix="/api/v1/backup", tags=["backup"])


@router.get("/list")
async def list_backups() -> dict:
    return {"items": container.backup_service.list_backups()}


@router.post("/create", response_model=ApiResponse)
async def create_backup() -> ApiResponse:
    cfg = container.settings_service.load()
    backup = container.backup_service.create_backup(cfg.data_dir)
    task = container.task_service.create("backup", f"创建备份 {backup.name}")
    container.task_service.update(task.id, "completed", f"备份创建成功: {backup.name}")
    await container.status_service.broadcast(f"备份创建成功: {backup.name}", "success")
    return ApiResponse(success=True, message=f"备份创建成功：{backup.name}")


@router.post("/restore", response_model=ApiResponse)
async def restore_backup(payload: RestoreRequest) -> ApiResponse:
    cfg = container.settings_service.load()
    ok, msg = container.backup_service.restore_backup(payload.backup_name, cfg.data_dir)
    task = container.task_service.create("restore", f"恢复备份 {payload.backup_name}")
    container.task_service.update(task.id, "completed" if ok else "failed", msg)
    await container.status_service.broadcast(msg, "success" if ok else "error")
    return ApiResponse(success=ok, message=msg)
