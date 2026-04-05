from fastapi import APIRouter

from app.schemas.ai import ApiResponse
from app.schemas.collab import SharePayload
from app.state import container

router = APIRouter(prefix="/api/v1/shares", tags=["shares"])


@router.get("/public")
async def public_shares() -> dict:
    return {"items": container.share_service.list_public()}


@router.get("/{share_id}")
async def get_share(share_id: str) -> dict:
    item = container.share_service.get_share(share_id)
    if not item:
        return {"success": False, "message": "分享不存在。"}
    return {"success": True, "item": item}


@router.post("", response_model=ApiResponse)
async def create_share(payload: SharePayload) -> ApiResponse:
    item = container.share_service.create_share(payload.model_dump())
    await container.status_service.broadcast(f"已生成分享链接: {item['id']}", "success")
    return ApiResponse(success=True, message=f"分享链接创建成功：{item['id']}")

