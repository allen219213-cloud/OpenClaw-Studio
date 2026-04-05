from pydantic import BaseModel, Field


class WorkflowNode(BaseModel):
    id: str
    type: str
    position: dict = Field(default_factory=dict)
    data: dict = Field(default_factory=dict)


class WorkflowEdge(BaseModel):
    id: str
    source: str
    target: str
    data: dict = Field(default_factory=dict)
    label: str = ""


class WorkflowGraph(BaseModel):
    nodes: list[WorkflowNode] = Field(default_factory=list)
    edges: list[WorkflowEdge] = Field(default_factory=list)


class WorkflowPayload(BaseModel):
    name: str
    description: str = ""
    category: str = "general"
    tags: list[str] = Field(default_factory=list)
    graph: WorkflowGraph
    variables: dict = Field(default_factory=dict)
    compatibility_mode: str = "openclaw-v1"


class WorkflowImportPayload(BaseModel):
    format: str
    content: str


class WorkflowExportPayload(BaseModel):
    format: str


class ExecuteActionPayload(BaseModel):
    action: str

