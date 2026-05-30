"use client";

import { create } from "zustand";
import type { HardwareInput, HardwareInfo } from "@/types/hardware";

type DetectionStatus = "idle" | "detecting" | "detected" | "error";

interface HardwareState {
  /** Current detection phase */
  status: DetectionStatus;
  /** Raw browser-detected hardware */
  input: HardwareInput | null;
  /** Server-resolved hardware info (after recommendation API call) */
  resolved: HardwareInfo | null;
  /** Error message if detection failed */
  error: string | null;

  /** Actions */
  setStatus: (status: DetectionStatus) => void;
  setInput: (input: HardwareInput) => void;
  setResolved: (resolved: HardwareInfo) => void;
  setError: (error: string) => void;
  reset: () => void;
}

const initialState = {
  status: "idle" as DetectionStatus,
  input: null,
  resolved: null,
  error: null,
};

export const useHardwareStore = create<HardwareState>((set) => ({
  ...initialState,
  setStatus: (status) => set({ status }),
  setInput: (input) => set({ input, status: "detected" }),
  setResolved: (resolved) => set({ resolved }),
  setError: (error) => set({ error, status: "error" }),
  reset: () => set(initialState),
}));
