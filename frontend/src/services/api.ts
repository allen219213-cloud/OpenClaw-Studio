import type {
  ApiResponse,
  BackupInfo,
  DashboardPayload,
  InitStatus,
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
