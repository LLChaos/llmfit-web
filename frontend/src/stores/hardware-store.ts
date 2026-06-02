"use client";

import { create } from "zustand";
import type { HardwareInput, HardwareInfo } from "@/types/hardware";

type DetectionStatus = "idle" | "detecting" | "detected" | "error";

interface HardwareState {
  /** Current detection phase */
  status: DetectionStatus;
  /** Raw browser-detected hardware */
  input: HardwareInput | null;
  /** User-overridden GPU name (empty string = use detected) */
  manualGpu: string;
  /** Server-resolved hardware info (after recommendation API call) */
  resolved: HardwareInfo | null;
  /** Error message if detection failed */
  error: string | null;

  /** The effective GPU name sent to the API */
  effectiveGpu: () => string;

  /** Actions */
  setStatus: (status: DetectionStatus) => void;
  setInput: (input: HardwareInput) => void;
  setManualGpu: (gpu: string) => void;
  setResolved: (resolved: HardwareInfo) => void;
  setError: (error: string) => void;
  reset: () => void;
}

const initialState = {
  status: "idle" as DetectionStatus,
  input: null,
  manualGpu: "",
  resolved: null,
  error: null,
};

export const useHardwareStore = create<HardwareState>((set, get) => ({
  ...initialState,
  effectiveGpu: () => {
    const s = get();
    return s.manualGpu || s.input?.gpuName || "";
  },
  setStatus: (status) => set({ status }),
  setInput: (input) => set({ input, status: "detected" }),
  setManualGpu: (manualGpu) => set({ manualGpu }),
  setResolved: (resolved) => set({ resolved }),
  setError: (error) => set({ error, status: "error" }),
  reset: () => set(initialState),
}));
