from fastapi import APIRouter

from app.schemas.ai import ApiResponse
from app.schemas.collab import ToolInstallPayload, ToolReviewPayload
from app.state import container

router = APIRouter(prefix="/api/v1/tools", tags=["tools"])


@router.get("")
async def list_tools(q: str = "") -> dict:
    return {"items": container.tool_market_service.list_tools(q)}


@router.post("/install", response_model=ApiResponse)
async def install_tool(payload: ToolInstallPayload) -> ApiResponse:
    container.tool_market_service.install_third_party(payload.model_dump())
    await container.status_service.broadcast(f"工具安装成功: {payload.name}", "success")
    return ApiResponse(success=True, message="工具安装成功。")


@router.get("/{tool_name}/reviews")
async def list_reviews(tool_name: str) -> dict:
    return {"items": container.tool_market_service.list_reviews(tool_name)}


@router.post("/reviews", response_model=ApiResponse)
async def add_review(payload: ToolReviewPayload) -> ApiResponse:
    if payload.rating < 1 or payload.rating > 5:
        return ApiResponse(success=False, message="评分范围必须是 1-5。")
    container.tool_market_service.add_review(payload.model_dump())
    return ApiResponse(success=True, message="评论提交成功。")

