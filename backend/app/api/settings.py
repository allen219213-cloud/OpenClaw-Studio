from fastapi import APIRouter

from app.schemas.common import ApiResponse, SettingsUpdateRequest, SystemSettings
from app.state import container

router = APIRouter(prefix="/api/v1/settings", tags=["settings"])


@router.get("", response_model=SystemSettings)
async def get_settings() -> SystemSettings:
    return container.settings_service.load()


@router.put("", response_model=ApiResponse)
async def update_settings(payload: SettingsUpdateRequest) -> ApiResponse:
    container.settings_service.save(SystemSettings(**payload.model_dump()))
    await container.status_service.broadcast("系统设置已更新", "success")
    return ApiResponse(success=True, message="设置已保存。")
