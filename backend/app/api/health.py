from fastapi import APIRouter

from app.schemas.common import ApiResponse

router = APIRouter(prefix="/api/v1", tags=["health"])


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/ping", response_model=ApiResponse)
async def ping() -> ApiResponse:
    return ApiResponse(success=True, message="服务可用")
