import type {
  Agent,
  AgentInput,
  AgentTemplate,
  ApiResponse,
  BackupInfo,
  DashboardPayload,
  InitStatus,
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
