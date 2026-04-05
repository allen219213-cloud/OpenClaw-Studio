from fastapi import APIRouter

from app.state import container

router = APIRouter(prefix="/api/v1/templates", tags=["templates"])


@router.get("")
async def list_templates() -> dict:
    return {"items": container.template_service.list_templates()}
