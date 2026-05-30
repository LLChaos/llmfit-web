"use client";

import { useCallback } from "react";
import { useHardwareStore } from "@/stores/hardware-store";
import { detectHardware } from "@/features/hardware-detection";

export function useHardwareDetection() {
  const store = useHardwareStore();

  const analyze = useCallback(async () => {
    store.setStatus("detecting");
    try {
      const input = await detectHardware();
      store.setInput(input);
    } catch (err) {
      store.setError(
        err instanceof Error ? err.message : "Hardware detection failed"
      );
    }
  }, [store]);

  return {
    status: store.status,
    input: store.input,
    error: store.error,
    analyze,
    reset: store.reset,
  };
}
