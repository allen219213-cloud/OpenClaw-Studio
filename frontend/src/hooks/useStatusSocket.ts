import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import type { BackendStatus } from "@/types/status";
import { wsStatusUrl } from "@/services/api";

export function useStatusSocket(): void {
  const addLog = useAppStore((state) => state.addLog);

  useEffect(() => {
    const socket = new WebSocket(wsStatusUrl());

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as BackendStatus;
        addLog(payload);
      } catch {
        addLog({
          level: "error",
          message: "Received invalid websocket payload",
          at: new Date().toISOString()
        });
      }
    };

    socket.onerror = () => {
      addLog({
        level: "error",
        message: "WebSocket connection error",
        at: new Date().toISOString()
      });
    };

    return () => {
      socket.close();
    };
  }, [addLog]);
}
