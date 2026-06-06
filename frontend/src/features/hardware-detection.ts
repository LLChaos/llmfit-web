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
  let gpuName = detectGpu();
  const ramGb = detectRam();
  const cpuCores = navigator.hardwareConcurrency || 1;
  const os = detectOs();

  // Laptop GPU detection: many NVIDIA drivers omit "Laptop GPU" from
  // the WebGL renderer string.  When the browser runs on a laptop
  // (detected via Battery API or touch+form-factor heuristics) and
  // the GPU name lacks mobile markers, append "Laptop GPU" so the
  // backend can normalize it to the dbgpu "Mobile" entry (e.g.
  // "GeForce RTX 4080 Mobile" with 12 GB instead of the desktop
  // 16 GB variant).
  const laptop = await isLaptop();
  const hasMarker = hasLaptopMarker(gpuName);
  const isNvidia = isDiscreteNvidiaGpu(gpuName);

  if (laptop && !hasMarker && isNvidia) {
    console.log(
      "[LLMFit] Laptop detected — appending 'Laptop GPU' to:",
      gpuName,
    );
    gpuName = gpuName + " Laptop GPU";
  } else {
    console.log(
      "[LLMFit] GPU marker skip:",
      { laptop, hasMarker, isNvidia, gpuName },
    );
  }

  return { gpuName, ramGb, cpuCores, os };
}

/**
 * Heuristic: does this GPU name look like a discrete NVIDIA GPU
 * that might have a distinct mobile (lower-VRAM) variant?
 *
 * Integrated GPUs (Intel UHD/Iris, AMD Radeon iGPU) and Apple
 * Silicon don't have separate mobile entries, so we skip the
 * marker to avoid false matches.
 */
function isDiscreteNvidiaGpu(name: string): boolean {
  return /\b(?:NVIDIA\s+)?(?:GeForce\s+)?(?:RTX|GTX)\s+\d+/i.test(name);
}

/** Check whether the GPU name already includes a laptop/mobile marker. */
function hasLaptopMarker(name: string): boolean {
  return /\b(?:Laptop|Notebook|Mobile|Max-Q)\b/i.test(name);
}

/**
 * Detect whether the current device is likely a laptop.
 *
 * Strategy (ordered by reliability):
 *   1. Battery API — desktops never have batteries.
 *   2. Touch screen + small viewport on Windows — common 2-in-1 / laptop pattern.
 */
async function isLaptop(): Promise<boolean> {
  // Signal 1: Battery API — desktops never have batteries.
  // Available in Chromium browsers (Chrome, Edge, Opera).
  try {
    if ("getBattery" in navigator) {
      const battery = await (
        navigator as Navigator & {
          getBattery(): Promise<{ charging: boolean }>;
        }
      ).getBattery();
      if (battery) return true;
    }
  } catch {
    // Battery API unavailable or permission denied
  }

  // Signal 2: User-Agent Client Hints (Chrome 90+, Edge 90+).
  try {
    const uaData = (
      navigator as Navigator & {
        userAgentData?: { mobile: boolean };
      }
    ).userAgentData;
    if (uaData?.mobile) return true;
  } catch {
    // userAgentData not available
  }

  // Signal 3: Touch screen on Windows (rare on desktops, common on laptops).
  if (
    navigator.maxTouchPoints > 0 &&
    /Windows/i.test(navigator.userAgent)
  ) {
    return true;
  }

  return false;
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
    .replace(/\s*\(0x[0-9A-Fa-f]+\)\s*/i, "")  // PCI device ID e.g. (0x000027A0)
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
