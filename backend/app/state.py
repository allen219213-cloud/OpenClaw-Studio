from app.services.agent_service import AgentService
from app.services.backup_service import BackupService
from app.services.init_service import InitializationService
from app.services.openclaw_service import OpenClawService
from app.services.provider_service import ProviderService
from app.services.settings_service import SettingsService
from app.services.status_service import StatusBroadcastService
from app.services.system_service import SystemService
from app.services.task_service import TaskService
from app.services.template_service import AgentTemplateService
from app.services.workflow_execution_service import WorkflowExecutionService
from app.services.workflow_service import WorkflowService


class ServiceContainer:
    def __init__(self) -> None:
        self.status_service = StatusBroadcastService()
        self.task_service = TaskService()
        self.settings_service = SettingsService()
        self.system_service = SystemService()
        self.openclaw_service = OpenClawService()
        self.backup_service = BackupService()
        self.provider_service = ProviderService()
        self.agent_service = AgentService()
        self.template_service = AgentTemplateService()
        self.workflow_service = WorkflowService()
        self.workflow_execution_service = WorkflowExecutionService()
        self.init_service = InitializationService(self.task_service, self.status_service)


container = ServiceContainer()
