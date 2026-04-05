import { create } from "zustand";
import type { BackendStatus } from "@/types/status";

interface AppStore {
  logs: BackendStatus[];
  addLog: (log: BackendStatus) => void;
  clearLogs: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  logs: [],
  addLog: (log) =>
    set((state) => ({
      logs: [log, ...state.logs].slice(0, 100)
    })),
  clearLogs: () => set({ logs: [] })
}));
