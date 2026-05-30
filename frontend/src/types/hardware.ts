/** Hardware input collected from browser APIs. */
export interface HardwareInput {
  gpuName: string;
  ramGb: number;
  cpuCores: number;
  os: string;
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

/** Full hardware profile after server-side resolution. */
export interface HardwareInfo {
  gpuName: string;
  vramGb: number;
  gpuTier: string;
  ramGb: number;
  cpuCores: number;
  os: string;
}
