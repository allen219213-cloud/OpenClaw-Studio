export type StatusLevel = "info" | "success" | "error";

export interface BackendStatus {
  level: StatusLevel;
  message: string;
  at: string;
}
