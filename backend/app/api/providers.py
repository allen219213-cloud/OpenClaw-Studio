from fastapi import APIRouter

from app.schemas.ai import ApiResponse, ProviderConfigCreate, ProviderConfigUpdate, ensure_provider
from app.state import container

router = APIRouter(prefix="/api/v1/providers", tags=["providers"])


@router.get("")
async def list_configs() -> dict:
    return {"items": container.provider_service.list_configs()}


@router.post("", response_model=ApiResponse)
async def create_config(payload: ProviderConfigCreate) -> ApiResponse:
    if not ensure_provider(payload.provider):
        return ApiResponse(success=False, message="不支持的提供商。")
    container.provider_service.create_config(payload.model_dump())
    await container.status_service.broadcast("API 配置已添加", "success")
    return ApiResponse(success=True, message="配置添加成功。")


@router.put("/{config_id}", response_model=ApiResponse)
async def update_config(config_id: str, payload: ProviderConfigUpdate) -> ApiResponse:
    if not ensure_provider(payload.provider):
        return ApiResponse(success=False, message="不支持的提供商。")
    ok, _ = container.provider_service.update_config(config_id, payload.model_dump())
    if not ok:
        return ApiResponse(success=False, message="未找到配置项。")
    await container.status_service.broadcast("API 配置已更新", "success")
    return ApiResponse(success=True, message="配置更新成功。")


@router.delete("/{config_id}", response_model=ApiResponse)
async def delete_config(config_id: str) -> ApiResponse:
    ok = container.provider_service.delete_config(config_id)
    if not ok:
        return ApiResponse(success=False, message="未找到配置项。")
    await container.status_service.broadcast("API 配置已删除", "success")
    return ApiResponse(success=True, message="配置删除成功。")


@router.post("/{config_id}/test", response_model=ApiResponse)
async def test_config(config_id: str) -> ApiResponse:
    ok, msg = container.provider_service.test_connection(config_id)
    await container.status_service.broadcast(msg, "success" if ok else "error")
    return ApiResponse(success=ok, message=msg)


@router.get("/meta/providers")
async def providers_meta() -> dict:
    return {
        "items": [
            {"value": "openai", "label": "OpenAI"},
            {"value": "anthropic", "label": "Anthropic"},
            {"value": "google_gemini", "label": "Google Gemini"},
            {"value": "deepseek", "label": "DeepSeek"},
            {"value": "doubao", "label": "字节豆包"},
            {"value": "tongyi_qianwen", "label": "通义千问"},
            {"value": "wenxin_yiyan", "label": "文心一言"},
        ]
    }
