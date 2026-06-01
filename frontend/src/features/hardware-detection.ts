import type { HardwareInput } from "@/types/hardware";

/**
 * Detect hardware from browser APIs.
 *
 * GPU detection strategy (priority order):
 * 1. WebGL with powerPreference: "high-performance" — most likely to
 *    return the dedicated/discrete GPU on dual-GPU systems (Optimus).
 * 2. WebGPU (navigator.gpu) — fallback; tends to pick integrated GPU.
 *
 * Other hardware:
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

/**
 * Parse the ANGLE renderer string from WebGL into a clean GPU name.
 *
 * WebGL UNMASKED_RENDERER_WEBGL returns strings like:
 *   "ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0)"
 *   "ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0)"
 *   "AMD Radeon RX 7900 XTX"
 *
 * We extract the GPU model name from the ANGLE parenthesized format
 * and strip Direct3D/version suffixes.
 */
function parseAngleRenderer(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("ANGLE (")) {
    cleaned = cleaned.slice(7);
  }
  if (cleaned.endsWith(")")) {
    cleaned = cleaned.slice(0, -1);
  }

  // "Vendor, GPU Name, maybe more" — pick the descriptive segment
  const parts = cleaned.split(",").map((s) => s.trim());
  if (parts.length >= 2) {
    const candidates = parts.filter(
      (p) => !/^(NVIDIA|AMD|Intel|Apple|Qualcomm|ARM)$/i.test(p),
    );
    if (candidates.length > 0) {
      candidates.sort((a, b) => b.length - a.length);
      return candidates[0]
        .replace(/\s*Direct3D.*$/i, "")
        .replace(/\s*D3D11.*$/i, "")
        .replace(/\s*vs_\d+_\d+.*$/i, "")
        .replace(/\s*ps_\d+_\d+.*$/i, "")
        .replace(/\s*Metal.*$/i, "")
        .trim();
    }
  }

  return cleaned
    .replace(/\s*Direct3D.*$/i, "")
    .replace(/\s*D3D11.*$/i, "")
    .replace(/\s*vs_\d+_\d+.*$/i, "")
    .replace(/\s*ps_\d+_\d+.*$/i, "")
    .trim();
}

async function detectGpu(): Promise<string> {
  // ── Strategy 1: WebGL with high-performance power preference ──
  // Most reliable way to get the dedicated GPU on dual-GPU laptops.
  // Reference: powerPreference hint + UNMASKED_RENDERER_WEBGL extension.
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2", { powerPreference: "high-performance" }) ||
      canvas.getContext("webgl", { powerPreference: "high-performance" });
    if (gl) {
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      if (debugInfo) {
        const rawRenderer = gl.getParameter(
          debugInfo.UNMASKED_RENDERER_WEBGL,
        );
        if (rawRenderer && !isSoftwareRenderer(rawRenderer)) {
          return parseAngleRenderer(rawRenderer);
        }
      }
    }
  } catch {
    // WebGL not available
  }

  // ── Strategy 2: WebGPU with high-performance hint ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gpu = (navigator as any).gpu;
  if (gpu) {
    try {
      let adapter = await gpu.requestAdapter({
        powerPreference: "high-performance",
      });
      if (!adapter) {
        adapter = await gpu.requestAdapter();
      }
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
      // WebGPU not available
    }
  }

  // ── Strategy 3: WebGL without powerPreference (last resort) ──
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (gl) {
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      if (debugInfo) {
        const rawRenderer = gl.getParameter(
          debugInfo.UNMASKED_RENDERER_WEBGL,
        );
        if (rawRenderer && !isSoftwareRenderer(rawRenderer)) {
          return parseAngleRenderer(rawRenderer);
        }
      }
    }
  } catch {
    // WebGL not available
  }

  return "Unknown GPU";
}

/** Software renderers indicate no usable GPU — discard these results. */
function isSoftwareRenderer(renderer: string): boolean {
  return /SwiftShader|llvmpipe|softpipe|GDI Generic/i.test(renderer);
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
