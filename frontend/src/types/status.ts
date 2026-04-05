export type StatusLevel = "info" | "success" | "error";

export interface BackendStatus {
  level: StatusLevel;
  message: string;
  at: string;
}

export interface SystemMetric {
  cpu_percent: number;
  memory_percent: number;
  disk_percent: number;
}

export interface ServiceStatus {
  name: string;
  status: "running" | "stopped";
  pid: number | null;
  updated_at: string;
}

export interface TaskInfo {
  id: string;
  name: string;
  status: "running" | "completed" | "failed";
  message: string;
  created_at: string;
  updated_at: string;
}

export interface TaskStats {
  total: number;
  running: number;
  completed: number;
  failed: number;
}

export interface DashboardPayload {
  metrics: SystemMetric;
  service: ServiceStatus;
  task_stats: TaskStats;
  recent_tasks: TaskInfo[];
}

export interface SystemSettings {
  port: number;
  data_dir: string;
  log_level: string;
  proxy_enabled: boolean;
  proxy_url: string;
  cors_origins: string[];
  openclaw_install_source: string;
  openclaw_start_command: string;
}

export interface InitStatus {
  in_progress: boolean;
  progress: number;
  current_step: string;
  message: string;
  started_at: string | null;
  finished_at: string | null;
}

export interface BackupInfo {
  name: string;
  created_at: string;
  size_bytes: number;
}

export interface ApiResponse {
  success: boolean;
  message: string;
}
