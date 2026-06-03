/** Hardware input collected from browser APIs. */
export interface HardwareInput {
  gpuName: string;
  ramGb: number;
  cpuCores: number;
  os: string;
  /** Manual VRAM override — when set, skips backend GPU→VRAM mapping. */
  vramGb?: number;
}

/** Resolved GPU info from backend. */
export interface GpuInfo {
  gpuName: string;
  vramGb: number;
  gpuTier: "entry" | "mid" | "high" | "enthusiast";
  vendor: string;
  benchmarkScore?: number;
  flopsTflops?: number;
  memoryBandwidthGbS?: number;
}

/** GPU summary for list display. */
export interface GpuListItem {
  id: string;
  name: string;
  vendor: string;
  vramGb: number;
  benchmarkScore?: number;
  flopsTflops?: number;
  memoryBandwidthGbS?: number;
  tier: string;
}

/** GPU detail with compatible models. */
export interface GpuDetail extends GpuListItem {
  compatibleModels: Array<{
    id: string;
    family: string;
    name: string;
    parameterCountB: number;
    quantization: string;
    quantizationBits: number;
    minVramGb: number;
    recommendedVramGb: number;
    contextLength: number;
    qualityScore: number;
  }>;
}

/** Full hardware profile after server-side resolution. */
export interface HardwareInfo {
  gpuName: string;
  vramGb: number;
  gpuTier: string;
  ramGb: number;
  cpuCores: number;
  os: string;
}
