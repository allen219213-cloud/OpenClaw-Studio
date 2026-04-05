const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export async function healthCheck(): Promise<{ status: string }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/health`);
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }
  return response.json();
}

export function wsStatusUrl(): string {
  const fallback = "ws://localhost:8000/ws/status";
  return import.meta.env.VITE_WS_URL ?? fallback;
}
