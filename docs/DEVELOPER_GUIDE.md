# 开发者文档

## 架构
- Frontend: React + TypeScript + React Flow + Zustand
- Backend: FastAPI + 文件存储（runtime 目录）
- 实时通信: WebSocket (`/ws/status`, `/ws/workflows/{id}/logs`)

## 核心模块
- `app/services/workflow_service.py`: 任务流 CRUD 与模板
- `app/services/workflow_execution_service.py`: 任务执行与日志广播
- `app/services/tool_market_service.py`: 工具市场与评分
- `app/services/user_service.py`: 简单用户和会话
- `app/services/share_service.py`: 分享链接
- `app/services/community_template_service.py`: 社区模板

## API 分组
- `/api/v1/workflows`: 任务与执行
- `/api/v1/tools`: 工具市场
- `/api/v1/users`: 用户管理
- `/api/v1/shares`: 分享
- `/api/v1/community`: 社区模板

## 错误处理与日志
- FastAPI 全局异常处理统一返回用户可读消息。
- 请求日志写入 `runtime/app.log`，包含方法、路径、状态码、耗时。
