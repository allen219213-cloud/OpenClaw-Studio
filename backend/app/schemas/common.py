from datetime import datetime, timezone

from pydantic import BaseModel, Field


class ApiResponse(BaseModel):
    success: bool
    message: str


class SystemMetric(BaseModel):
    cpu_percent: float
    memory_percent: float
    disk_percent: float


class ServiceStatus(BaseModel):
    name: str = "openclaw"
    status: str
    pid: int | None = None
    updated_at: str


class TaskInfo(BaseModel):
    id: str
    name: str
    status: str
    message: str
    created_at: str
    updated_at: str


class TaskStats(BaseModel):
    total: int
    running: int
    completed: int
    failed: int


class DashboardPayload(BaseModel):
    metrics: SystemMetric
    service: ServiceStatus
    task_stats: TaskStats
    recent_tasks: list[TaskInfo]


class SystemSettings(BaseModel):
    port: int = 8000
    data_dir: str = "./runtime/data"
    log_level: str = "INFO"
    proxy_enabled: bool = False
    proxy_url: str = ""
    cors_origins: list[str] = Field(default_factory=lambda: ["*"])
    openclaw_install_source: str = ""
    openclaw_start_command: str = "python -m openclaw"


class BackupInfo(BaseModel):
    name: str
    created_at: str
    size_bytes: int


class InitStatus(BaseModel):
    in_progress: bool
    progress: int
    current_step: str
    message: str
    started_at: str | None = None
    finished_at: str | None = None


class ServiceActionRequest(BaseModel):
    action: str


class SettingsUpdateRequest(BaseModel):
    port: int
    data_dir: str
    log_level: str
    proxy_enabled: bool
    proxy_url: str
    cors_origins: list[str]
    openclaw_install_source: str
    openclaw_start_command: str


class RestoreRequest(BaseModel):
    backup_name: str


class ErrorResponse(BaseModel):
    success: bool = False
    message: str = "系统暂时不可用，请稍后重试。"
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
