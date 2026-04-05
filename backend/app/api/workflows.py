from pathlib import Path

from fastapi import APIRouter

from app.core.config import settings
from app.schemas.ai import ApiResponse
from app.schemas.workflow import ExecuteActionPayload, WorkflowExportPayload, WorkflowImportPayload, WorkflowPayload
from app.state import container

router = APIRouter(prefix="/api/v1/workflows", tags=["workflows"])


@router.get("")
async def list_workflows(q: str = "", category: str = "") -> dict:
    return {"items": container.workflow_service.list(query=q, category=category)}


@router.get("/templates")
async def list_templates() -> dict:
    return {"items": container.workflow_service.templates()}


@router.get("/{workflow_id}")
async def get_workflow(workflow_id: str) -> dict:
    item = container.workflow_service.get(workflow_id)
    if not item:
        return {"success": False, "message": "未找到任务。"}
    return {"success": True, "item": item}


@router.post("", response_model=ApiResponse)
async def create_workflow(payload: WorkflowPayload) -> ApiResponse:
    if not payload.name.strip():
        return ApiResponse(success=False, message="任务名称不能为空。")
    container.workflow_service.create(payload.model_dump())
    await container.status_service.broadcast("任务创建成功", "success")
    return ApiResponse(success=True, message="任务创建成功。")


@router.put("/{workflow_id}", response_model=ApiResponse)
async def update_workflow(workflow_id: str, payload: WorkflowPayload) -> ApiResponse:
    ok, _ = container.workflow_service.update(workflow_id, payload.model_dump())
    if not ok:
        return ApiResponse(success=False, message="未找到任务。")
    await container.status_service.broadcast("任务更新成功", "success")
    return ApiResponse(success=True, message="任务更新成功。")


@router.delete("/{workflow_id}", response_model=ApiResponse)
async def delete_workflow(workflow_id: str) -> ApiResponse:
    ok = container.workflow_service.delete(workflow_id)
    if not ok:
        return ApiResponse(success=False, message="未找到任务。")
    await container.status_service.broadcast("任务删除成功", "success")
    return ApiResponse(success=True, message="任务删除成功。")


@router.post("/{workflow_id}/export")
async def export_workflow(workflow_id: str, payload: WorkflowExportPayload) -> dict:
    ok, content, msg = container.workflow_service.export(workflow_id, payload.format)
    return {"success": ok, "message": msg, "content": content}


@router.post("/import", response_model=ApiResponse)
async def import_workflow(payload: WorkflowImportPayload) -> ApiResponse:
    ok, _, msg = container.workflow_service.import_data(payload.format, payload.content)
    if ok:
        await container.status_service.broadcast("任务导入成功", "success")
    return ApiResponse(success=ok, message=msg)


@router.get("/{workflow_id}/run")
async def run_state(workflow_id: str) -> dict:
    return {"item": container.workflow_execution_service.get_run(workflow_id)}


@router.post("/{workflow_id}/execute", response_model=ApiResponse)
async def execute_workflow(workflow_id: str, payload: ExecuteActionPayload) -> ApiResponse:
    workflow = container.workflow_service.get(workflow_id)
    if not workflow:
        return ApiResponse(success=False, message="未找到任务。")

    action = payload.action
    if action == "start":
        ok, msg = container.workflow_execution_service.execute(workflow_id, workflow)
    elif action == "pause":
        ok, msg = container.workflow_execution_service.pause(workflow_id)
    elif action == "resume":
        ok, msg = container.workflow_execution_service.resume(workflow_id)
    elif action == "stop":
        ok, msg = container.workflow_execution_service.stop(workflow_id)
    elif action == "retry":
        ok, msg = container.workflow_execution_service.retry(workflow_id, workflow)
    else:
        return ApiResponse(success=False, message="不支持的执行动作。")

    await container.status_service.broadcast(msg, "success" if ok else "error")
    return ApiResponse(success=ok, message=msg)


@router.get("/{workflow_id}/result/export")
async def export_result(workflow_id: str, format: str) -> dict:
    ok, path, msg = container.workflow_execution_service.export_result(
        workflow_id,
        format,
        Path(settings.runtime_dir / "exports"),
    )
    return {"success": ok, "message": msg, "path": path}

