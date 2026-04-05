from pydantic import BaseModel, Field

from app.services.provider_service import SUPPORTED_PROVIDERS


class ApiResponse(BaseModel):
    success: bool
    message: str


class ProviderConfigCreate(BaseModel):
    provider: str
    name: str
    api_key: str
    base_url: str = ""
    proxy_url: str = ""
    default_model: str = ""
    quota_limit: float = 0
    quota_used: float = 0


class ProviderConfigUpdate(BaseModel):
    provider: str
    name: str
    api_key: str = ""
    base_url: str = ""
    proxy_url: str = ""
    default_model: str = ""
    quota_limit: float = 0
    quota_used: float = 0


class ToolConfig(BaseModel):
    name: str
    enabled: bool = True
    config: dict = Field(default_factory=dict)


class ModelConfig(BaseModel):
    model: str = "openai/gpt-4.1-mini"
    temperature: float = 0.7
    max_tokens: int = 2048


class MemoryConfig(BaseModel):
    short_term_turns: int = 20
    long_term_enabled: bool = False
    long_term_namespace: str = "default"


class AgentPayload(BaseModel):
    name: str
    description: str = ""
    avatar: str = "🤖"
    system_prompt: str = ""
    model_config: ModelConfig = Field(default_factory=ModelConfig)
    tools: list[ToolConfig] = Field(default_factory=list)
    memory: MemoryConfig = Field(default_factory=MemoryConfig)
    tags: list[str] = Field(default_factory=list)


class ImportPayload(BaseModel):
    format: str
    content: str


class ExportPayload(BaseModel):
    format: str


def ensure_provider(provider: str) -> bool:
    return provider in SUPPORTED_PROVIDERS
