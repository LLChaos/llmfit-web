import type { HardwareInput } from "@/types/hardware";

/**
 * Detect hardware from browser APIs.
 *
 * GPU detection: pure WebGL approach (ref: hardwaretester.com/gpu).
 * Uses canvas.getContext('webgl2') → UNMASKED_RENDERER_WEBGL.
 * No powerPreference hints, no WebGPU — trust the OS rendering device.
 *
 * Other hardware:
 * - navigator.deviceMemory for RAM (Chrome-only, returns GB)
 * - navigator.hardwareConcurrency for CPU threads
 * - navigator.userAgent for OS detection
 */
export async function detectHardware(): Promise<HardwareInput> {
  const gpuName = detectGpu();
  const ramGb = detectRam();
  const cpuCores = navigator.hardwareConcurrency || 1;
  const os = detectOs();

  return { gpuName, ramGb, cpuCores, os };
}

/**
 * Parse ANGLE renderer strings into clean GPU names.
 *
 * Raw values from UNMASKED_RENDERER_WEBGL:
 *   "ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0)"
 *   "ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0)"
 *   "ANGLE (Apple, ANGLE Metal Renderer: Apple M1 Pro, Unspecified Version)"
 *   "AMD Radeon RX 7900 XTX"
 */
function parseAngleRenderer(raw: string): string {
  let cleaned = raw.trim();

  // Strip ANGLE wrapper
  if (cleaned.startsWith("ANGLE (")) {
    cleaned = cleaned.slice(7);
  }
  if (cleaned.endsWith(")")) {
    cleaned = cleaned.slice(0, -1);
  }

  const parts = cleaned.split(",").map((s) => s.trim());

  if (parts.length >= 2) {
    // Filter out vendor-only segments, keep GPU model names
    const candidates = parts.filter(
      (p) => !/^(NVIDIA|AMD|Intel|Apple|Qualcomm|ARM)$/i.test(p),
    );
    if (candidates.length > 0) {
      candidates.sort((a, b) => b.length - a.length);
      return stripSuffixes(candidates[0]);
    }
  }

  return stripSuffixes(cleaned);
}

/** Remove Direct3D / Metal / Vulkan version suffixes from GPU name. */
function stripSuffixes(name: string): string {
  return name
    .replace(/\s*Direct3D.*$/i, "")
    .replace(/\s*D3D11.*$/i, "")
    .replace(/\s*vs_\d+_\d+.*$/i, "")
    .replace(/\s*ps_\d+_\d+.*$/i, "")
    .replace(/\s*Metal.*$/i, "")
    .replace(/\s*Vulkan.*$/i, "")
    .replace(/\s*Unspecified Version.*$/i, "")
    .trim();
}

/**
 * Detect GPU via pure WebGL.
 *
 * Single strategy: canvas.getContext('webgl2') with no extra options.
 * This is the approach used by hardwaretester.com/gpu — it trusts the
 * operating system to report whichever GPU it assigned to the browser.
 */
function detectGpu(): string {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (canvas.getContext("experimental-webgl") as any);

    if (!gl) return "Unknown GPU";

    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (!debugInfo) return "Unknown GPU";

    const raw = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    if (!raw || isSoftwareRenderer(raw)) return "Unknown GPU";

    return parseAngleRenderer(raw);
  } catch {
    return "Unknown GPU";
  }
}

/** Software renderers → user needs to enable hardware acceleration. */
function isSoftwareRenderer(renderer: string): boolean {
  return /SwiftShader|llvmpipe|softpipe|GDI Generic/i.test(renderer);
}

function detectRam(): number {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deviceMemory = (navigator as any).deviceMemory;
  if (typeof deviceMemory === "number" && deviceMemory > 0) {
    return deviceMemory;
  }
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
