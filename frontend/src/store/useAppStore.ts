import { create } from "zustand";
import type { BackendStatus } from "@/types/status";

interface AppStore {
  logs: BackendStatus[];
  notice: string;
  addLog: (log: BackendStatus) => void;
  clearLogs: () => void;
  setNotice: (message: string) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  logs: [],
  notice: "",
  addLog: (log) =>
    set((state) => ({
      logs: [log, ...state.logs].slice(0, 100),
      notice: log.message
    })),
  clearLogs: () => set({ logs: [] }),
  setNotice: (message) => set({ notice: message })
}));
