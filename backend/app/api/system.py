from fastapi import APIRouter

from app.schemas.common import DashboardPayload
from app.state import container

router = APIRouter(prefix="/api/v1/system", tags=["system"])


@router.get("/overview", response_model=DashboardPayload)
async def system_overview() -> DashboardPayload:
    metrics = container.system_service.collect_metrics()
    service = container.openclaw_service.status()
    stats = container.task_service.stats()
    recent = container.task_service.recent(5)
    return DashboardPayload(metrics=metrics, service=service, task_stats=stats, recent_tasks=recent)
