from fastapi import APIRouter

from app.schemas.ai import ApiResponse
from app.schemas.collab import CreateUserPayload, LoginPayload
from app.state import container

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.get("")
async def list_users() -> dict:
    return {"items": container.user_service.list_users()}


@router.post("", response_model=ApiResponse)
async def create_user(payload: CreateUserPayload) -> ApiResponse:
    ok, msg = container.user_service.create_user(payload.username, payload.password, payload.role)
    return ApiResponse(success=ok, message=msg)


@router.post("/login")
async def login(payload: LoginPayload) -> dict:
    ok, data, msg = container.user_service.login(payload.username, payload.password)
    return {"success": ok, "message": msg, "item": data}

