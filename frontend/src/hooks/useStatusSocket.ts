import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import type { BackendStatus } from "@/types/status";
import { wsStatusUrl } from "@/services/api";

export function useStatusSocket(): void {
  const addLog = useAppStore((state) => state.addLog);

  useEffect(() => {
    const socket = new WebSocket(wsStatusUrl());

    socket.onopen = () => {
      socket.send("subscribe");
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as BackendStatus;
        addLog(payload);
      } catch {
        addLog({
          level: "error",
          message: "实时消息解析失败",
          at: new Date().toISOString()
        });
      }
    };

    socket.onerror = () => {
      addLog({
        level: "error",
        message: "实时连接异常，请稍后重试",
        at: new Date().toISOString()
      });
    };

    return () => {
      socket.close();
    };
  }, [addLog]);
}
