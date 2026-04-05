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

export interface ProviderMeta {
  value: string;
  label: string;
}

export interface ProviderConfig {
  id: string;
  provider: string;
  name: string;
  api_key_masked: string;
  base_url: string;
  proxy_url: string;
  default_model: string;
  quota_limit: number;
  quota_used: number;
  usage_percent: number;
  created_at: string;
  updated_at: string;
}

export interface ProviderInput {
  provider: string;
  name: string;
  api_key: string;
  base_url: string;
  proxy_url: string;
  default_model: string;
  quota_limit: number;
  quota_used: number;
}

export interface ToolConfig {
  name: string;
  enabled: boolean;
  config: Record<string, unknown>;
}

export interface ModelConfig {
  model: string;
  temperature: number;
  max_tokens: number;
}

export interface MemoryConfig {
  short_term_turns: number;
  long_term_enabled: boolean;
  long_term_namespace: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  avatar: string;
  system_prompt: string;
  model_config: ModelConfig;
  tools: ToolConfig[];
  memory: MemoryConfig;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface AgentInput {
  name: string;
  description: string;
  avatar: string;
  system_prompt: string;
  model_config: ModelConfig;
  tools: ToolConfig[];
  memory: MemoryConfig;
  tags: string[];
}

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  agent: AgentInput;
}

export interface WorkflowNodeData {
  label?: string;
  [key: string]: unknown;
}

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: WorkflowNodeData;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  data?: Record<string, unknown>;
}

export interface WorkflowGraph {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  graph: WorkflowGraph;
  variables: Record<string, unknown>;
  compatibility_mode: string;
  openclaw_version: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowInput {
  name: string;
  description: string;
  category: string;
  tags: string[];
  graph: WorkflowGraph;
  variables: Record<string, unknown>;
  compatibility_mode: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  category: string;
  workflow: WorkflowInput;
}

export interface WorkflowRunState {
  status: "idle" | "running" | "paused" | "stopped" | "completed";
  progress: number;
  logs: Array<{ level: string; message: string; at: string; agent?: string }>;
  conversation: Array<{ agent: string; thought: string; at: string }>;
  result: string;
  updated_at: string;
}

export interface ToolItem {
  name: string;
  category: string;
  description: string;
  repo?: string;
  version?: string;
  rating: number;
  reviews: number;
}

export interface ToolReview {
  id: string;
  tool_name: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface UserInfo {
  id: string;
  username: string;
  role: "admin" | "user";
  created_at: string;
}

export interface SessionInfo {
  token: string;
  role: "admin" | "user";
  username: string;
}

export interface ShareItem {
  id: string;
  resource_type: string;
  resource_id: string;
  visibility: "public" | "private";
  owner: string;
  created_at: string;
}

export interface CommunityTemplate {
  id: string;
  name: string;
  description: string;
  template_type: string;
  content: Record<string, unknown>;
  author: string;
  downloads: number;
  rating: number;
  votes: number;
  created_at: string;
}
