from fastapi import APIRouter

from app.schemas.ai import AgentPayload, ApiResponse, ExportPayload, ImportPayload
from app.state import container

router = APIRouter(prefix="/api/v1/agents", tags=["agents"])


@router.get("")
async def list_agents(q: str = "", model: str = "", tag: str = "") -> dict:
    return {"items": container.agent_service.list_agents(query=q, model=model, tag=tag)}


@router.get("/{agent_id}")
async def get_agent(agent_id: str) -> dict:
    item = container.agent_service.get_agent(agent_id)
    if not item:
        return {"success": False, "message": "未找到智能体。"}
    return {"success": True, "item": item}


@router.post("", response_model=ApiResponse)
async def create_agent(payload: AgentPayload) -> ApiResponse:
    if not payload.name.strip():
        return ApiResponse(success=False, message="智能体名称不能为空。")
    container.agent_service.create_agent(payload.model_dump())
    await container.status_service.broadcast("智能体创建成功", "success")
    return ApiResponse(success=True, message="智能体创建成功。")


@router.put("/{agent_id}", response_model=ApiResponse)
async def update_agent(agent_id: str, payload: AgentPayload) -> ApiResponse:
    if not payload.name.strip():
        return ApiResponse(success=False, message="智能体名称不能为空。")
    ok, _ = container.agent_service.update_agent(agent_id, payload.model_dump())
    if not ok:
        return ApiResponse(success=False, message="未找到智能体。")
    await container.status_service.broadcast("智能体更新成功", "success")
    return ApiResponse(success=True, message="智能体更新成功。")


@router.delete("/{agent_id}", response_model=ApiResponse)
async def delete_agent(agent_id: str) -> ApiResponse:
    ok = container.agent_service.delete_agent(agent_id)
    if not ok:
        return ApiResponse(success=False, message="未找到智能体。")
    await container.status_service.broadcast("智能体删除成功", "success")
    return ApiResponse(success=True, message="智能体删除成功。")


@router.post("/{agent_id}/export")
async def export_agent(agent_id: str, payload: ExportPayload) -> dict:
    ok, content, msg = container.agent_service.export_agent(agent_id, payload.format)
    return {"success": ok, "message": msg, "content": content}


@router.post("/import", response_model=ApiResponse)
async def import_agent(payload: ImportPayload) -> ApiResponse:
    ok, _, msg = container.agent_service.import_agent(payload.format, payload.content)
    if ok:
        await container.status_service.broadcast("智能体导入成功", "success")
    return ApiResponse(success=ok, message=msg)
