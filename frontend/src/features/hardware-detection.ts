import type { HardwareInput } from "@/types/hardware";

/**
 * Detect hardware from browser APIs.
 *
 * Uses:
 * - navigator.gpu (WebGPU) for GPU name
 * - navigator.deviceMemory for RAM (Chrome-only, returns GB)
 * - navigator.hardwareConcurrency for CPU threads
 * - navigator.userAgent for OS detection
 *
 * Falls back gracefully when APIs are unavailable.
 */
export async function detectHardware(): Promise<HardwareInput> {
  const gpuName = await detectGpu();
  const ramGb = detectRam();
  const cpuCores = navigator.hardwareConcurrency || 1;
  const os = detectOs();

  return { gpuName, ramGb, cpuCores, os };
}

async function detectGpu(): Promise<string> {
  // Try WebGPU API first
  // WebGPU types not yet fully in TypeScript DOM lib — use `any` cast as workaround
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gpu = (navigator as any).gpu;
  if (gpu) {
    try {
      const adapter = await gpu.requestAdapter();
      if (adapter) {
        const info = await adapter.requestAdapterInfo();
        if (info.description) {
          return info.description;
        }
        const vendor = info.vendor || "";
        const arch = info.architecture || "";
        if (vendor || arch) {
          return `${vendor} ${arch}`.trim();
        }
      }
    } catch {
      // WebGPU not available or permission denied
    }
  }

  // Fallback: try WebGL renderer string
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (gl) {
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        if (renderer) {
          return renderer;
        }
      }
    }
  } catch {
    // WebGL not available
  }

  return "Unknown GPU";
}

function detectRam(): number {
  // navigator.deviceMemory is Chrome/Edge only — not in standard TypeScript types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deviceMemory = (navigator as any).deviceMemory;
  if (typeof deviceMemory === "number" && deviceMemory > 0) {
    return deviceMemory;
  }
  // Fallback: assume 8GB
  return 8;
}

function detectOs(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad"))
    return "iOS";
  return "Unknown";
}
