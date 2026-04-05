from pydantic import BaseModel


class LoginPayload(BaseModel):
    username: str
    password: str


class CreateUserPayload(BaseModel):
    username: str
    password: str
    role: str = "user"


class SharePayload(BaseModel):
    resource_type: str
    resource_id: str
    visibility: str = "private"
    owner: str = "unknown"


class CommunityTemplatePayload(BaseModel):
    name: str
    description: str = ""
    template_type: str = "workflow"
    content: dict = {}
    author: str = "anonymous"


class ToolInstallPayload(BaseModel):
    name: str
    description: str = ""
    repo: str = ""
    version: str = "latest"
    config_schema: dict = {}


class ToolReviewPayload(BaseModel):
    tool_name: str
    user_id: str
    rating: int
    comment: str = ""

