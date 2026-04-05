from fastapi import APIRouter

from app.schemas.ai import ApiResponse
from app.schemas.collab import CommunityTemplatePayload
from app.state import container

router = APIRouter(prefix="/api/v1/community", tags=["community"])


@router.get("/templates")
async def list_templates(q: str = "") -> dict:
    return {"items": container.community_template_service.list(q)}


@router.post("/templates", response_model=ApiResponse)
async def upload_template(payload: CommunityTemplatePayload) -> ApiResponse:
    container.community_template_service.upload(payload.model_dump())
    return ApiResponse(success=True, message="模板上传成功。")


@router.get("/templates/{template_id}/download")
async def download_template(template_id: str) -> dict:
    ok, item = container.community_template_service.download(template_id)
    if not ok or not item:
        return {"success": False, "message": "模板不存在。"}
    return {"success": True, "item": item}


@router.post("/templates/{template_id}/rate", response_model=ApiResponse)
async def rate_template(template_id: str, score: int) -> ApiResponse:
    ok, msg = container.community_template_service.rate(template_id, score)
    return ApiResponse(success=ok, message=msg)

