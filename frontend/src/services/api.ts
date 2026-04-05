import type {
  Agent,
  AgentInput,
  AgentTemplate,
  ApiResponse,
  BackupInfo,
  DashboardPayload,
  InitStatus,
  CommunityTemplate,
  Workflow,
  WorkflowInput,
  WorkflowRunState,
  WorkflowTemplate,
  SessionInfo,
  ShareItem,
  ToolItem,
  ToolReview,
  UserInfo,
  ProviderConfig,
  ProviderInput,
  ProviderMeta,
  SystemSettings
} from "@/types/status";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json"
    },
    ...options
  });

  const body = (await response.json()) as T & { message?: string };
  if (!response.ok) {
    throw new Error(body.message ?? "请求失败，请稍后再试");
  }
  return body;
}

export function wsStatusUrl(): string {
  return import.meta.env.VITE_WS_URL ?? "ws://localhost:8000/ws/status";
}

export function getOverview(): Promise<DashboardPayload> {
  return request<DashboardPayload>("/api/v1/system/overview");
}

export function serviceAction(action: "start" | "stop" | "restart"): Promise<ApiResponse> {
  return request<ApiResponse>(`/api/v1/service/${action}`, { method: "POST" });
}

export function getSettings(): Promise<SystemSettings> {
  return request<SystemSettings>("/api/v1/settings");
}

export function updateSettings(payload: SystemSettings): Promise<ApiResponse> {
  return request<ApiResponse>("/api/v1/settings", {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function createBackup(): Promise<ApiResponse> {
  return request<ApiResponse>("/api/v1/backup/create", { method: "POST" });
}

export function restoreBackup(backupName: string): Promise<ApiResponse> {
  return request<ApiResponse>("/api/v1/backup/restore", {
    method: "POST",
    body: JSON.stringify({ backup_name: backupName })
  });
}

export async function listBackups(): Promise<BackupInfo[]> {
  const response = await request<{ items: BackupInfo[] }>("/api/v1/backup/list");
  return response.items;
}

export function startInitialization(): Promise<ApiResponse> {
  return request<ApiResponse>("/api/v1/init/start", { method: "POST" });
}

export function getInitializationStatus(): Promise<InitStatus> {
  return request<InitStatus>("/api/v1/init/status");
}

export async function listProviderConfigs(): Promise<ProviderConfig[]> {
  const response = await request<{ items: ProviderConfig[] }>("/api/v1/providers");
  return response.items;
}

export async function listProviderMeta(): Promise<ProviderMeta[]> {
  const response = await request<{ items: ProviderMeta[] }>("/api/v1/providers/meta/providers");
  return response.items;
}

export function createProviderConfig(payload: ProviderInput): Promise<ApiResponse> {
  return request<ApiResponse>("/api/v1/providers", { method: "POST", body: JSON.stringify(payload) });
}

export function updateProviderConfig(id: string, payload: ProviderInput): Promise<ApiResponse> {
  return request<ApiResponse>(`/api/v1/providers/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteProviderConfig(id: string): Promise<ApiResponse> {
  return request<ApiResponse>(`/api/v1/providers/${id}`, { method: "DELETE" });
}

export function testProviderConfig(id: string): Promise<ApiResponse> {
  return request<ApiResponse>(`/api/v1/providers/${id}/test`, { method: "POST" });
}

export async function listAgents(query = "", model = "", tag = ""): Promise<Agent[]> {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (model) params.set("model", model);
  if (tag) params.set("tag", tag);
  const suffix = params.toString() ? `?${params}` : "";
  const response = await request<{ items: Agent[] }>(`/api/v1/agents${suffix}`);
  return response.items;
}

export function createAgent(payload: AgentInput): Promise<ApiResponse> {
  return request<ApiResponse>("/api/v1/agents", { method: "POST", body: JSON.stringify(payload) });
}

export function updateAgent(id: string, payload: AgentInput): Promise<ApiResponse> {
  return request<ApiResponse>(`/api/v1/agents/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteAgent(id: string): Promise<ApiResponse> {
  return request<ApiResponse>(`/api/v1/agents/${id}`, { method: "DELETE" });
}

export async function listTemplates(): Promise<AgentTemplate[]> {
  const response = await request<{ items: AgentTemplate[] }>("/api/v1/templates");
  return response.items;
}

export async function exportAgent(id: string, format: "json" | "yaml"): Promise<string> {
  const response = await request<{ success: boolean; message: string; content: string }>(
    `/api/v1/agents/${id}/export`,
    {
      method: "POST",
      body: JSON.stringify({ format })
    }
  );
  if (!response.success) {
    throw new Error(response.message);
  }
  return response.content;
}

export function importAgent(format: "json" | "yaml", content: string): Promise<ApiResponse> {
  return request<ApiResponse>("/api/v1/agents/import", {
    method: "POST",
    body: JSON.stringify({ format, content })
  });
}

export async function listWorkflows(query = "", category = ""): Promise<Workflow[]> {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (category) params.set("category", category);
  const suffix = params.toString() ? `?${params}` : "";
  const response = await request<{ items: Workflow[] }>(`/api/v1/workflows${suffix}`);
  return response.items;
}

export function createWorkflow(payload: WorkflowInput): Promise<ApiResponse> {
  return request<ApiResponse>("/api/v1/workflows", { method: "POST", body: JSON.stringify(payload) });
}

export function updateWorkflow(id: string, payload: WorkflowInput): Promise<ApiResponse> {
  return request<ApiResponse>(`/api/v1/workflows/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteWorkflow(id: string): Promise<ApiResponse> {
  return request<ApiResponse>(`/api/v1/workflows/${id}`, { method: "DELETE" });
}

export async function listWorkflowTemplates(): Promise<WorkflowTemplate[]> {
  const response = await request<{ items: WorkflowTemplate[] }>("/api/v1/workflows/templates");
  return response.items;
}

export async function exportWorkflow(id: string, format: "json" | "yaml"): Promise<string> {
  const response = await request<{ success: boolean; message: string; content: string }>(
    `/api/v1/workflows/${id}/export`,
    {
      method: "POST",
      body: JSON.stringify({ format })
    }
  );
  if (!response.success) {
    throw new Error(response.message);
  }
  return response.content;
}

export function importWorkflow(format: "json" | "yaml", content: string): Promise<ApiResponse> {
  return request<ApiResponse>("/api/v1/workflows/import", {
    method: "POST",
    body: JSON.stringify({ format, content })
  });
}

export function workflowAction(
  id: string,
  action: "start" | "pause" | "resume" | "stop" | "retry"
): Promise<ApiResponse> {
  return request<ApiResponse>(`/api/v1/workflows/${id}/execute`, {
    method: "POST",
    body: JSON.stringify({ action })
  });
}

export async function getWorkflowRun(id: string): Promise<WorkflowRunState> {
  const response = await request<{ item: WorkflowRunState }>(`/api/v1/workflows/${id}/run`);
  return response.item;
}

export async function exportWorkflowResult(
  id: string,
  format: "markdown" | "html" | "pdf"
): Promise<{ path: string; message: string; success: boolean }> {
  return request<{ path: string; message: string; success: boolean }>(
    `/api/v1/workflows/${id}/result/export?format=${format}`
  );
}

export async function listTools(query = ""): Promise<ToolItem[]> {
  const suffix = query ? `?q=${encodeURIComponent(query)}` : "";
  const response = await request<{ items: ToolItem[] }>(`/api/v1/tools${suffix}`);
  return response.items;
}

export function installTool(payload: {
  name: string;
  description: string;
  repo: string;
  version: string;
  config_schema: Record<string, unknown>;
}): Promise<ApiResponse> {
  return request<ApiResponse>("/api/v1/tools/install", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function listToolReviews(toolName: string): Promise<ToolReview[]> {
  const response = await request<{ items: ToolReview[] }>(`/api/v1/tools/${toolName}/reviews`);
  return response.items;
}

export function addToolReview(payload: {
  tool_name: string;
  user_id: string;
  rating: number;
  comment: string;
}): Promise<ApiResponse> {
  return request<ApiResponse>("/api/v1/tools/reviews", { method: "POST", body: JSON.stringify(payload) });
}

export async function listUsers(): Promise<UserInfo[]> {
  const response = await request<{ items: UserInfo[] }>("/api/v1/users");
  return response.items;
}

export function createUser(payload: { username: string; password: string; role: "admin" | "user" }): Promise<ApiResponse> {
  return request<ApiResponse>("/api/v1/users", { method: "POST", body: JSON.stringify(payload) });
}

export async function login(payload: { username: string; password: string }): Promise<{ success: boolean; message: string; item: SessionInfo | null }> {
  return request<{ success: boolean; message: string; item: SessionInfo | null }>("/api/v1/users/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function createShare(payload: {
  resource_type: string;
  resource_id: string;
  visibility: "public" | "private";
  owner: string;
}): Promise<ApiResponse> {
  return request<ApiResponse>("/api/v1/shares", { method: "POST", body: JSON.stringify(payload) });
}

export async function listPublicShares(): Promise<ShareItem[]> {
  const response = await request<{ items: ShareItem[] }>("/api/v1/shares/public");
  return response.items;
}

export async function listCommunityTemplates(query = ""): Promise<CommunityTemplate[]> {
  const suffix = query ? `?q=${encodeURIComponent(query)}` : "";
  const response = await request<{ items: CommunityTemplate[] }>(`/api/v1/community/templates${suffix}`);
  return response.items;
}

export function uploadCommunityTemplate(payload: {
  name: string;
  description: string;
  template_type: string;
  content: Record<string, unknown>;
  author: string;
}): Promise<ApiResponse> {
  return request<ApiResponse>("/api/v1/community/templates", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function downloadCommunityTemplate(templateId: string): Promise<{ success: boolean; item?: CommunityTemplate; message?: string }> {
  return request<{ success: boolean; item?: CommunityTemplate; message?: string }>(
    `/api/v1/community/templates/${templateId}/download`
  );
}

export function rateCommunityTemplate(templateId: string, score: number): Promise<ApiResponse> {
  return request<ApiResponse>(`/api/v1/community/templates/${templateId}/rate?score=${score}`, {
    method: "POST"
  });
}
