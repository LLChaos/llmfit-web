/** Model summary for list display. */
export interface ModelListItem {
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
}

/** Complete model detail. */
export interface ModelDetail {
  id: string;
  family: string;
  name: string;
  parameterCountB: number;
  quantization: string;
  quantizationBits: number;
  minVramGb: number;
  recommendedVramGb: number;
  contextLength: number;
  hiddenDim: number;
  numLayers: number;
  qualityScore: number;
  downloadUrl: string;
  huggingfaceRepo: string;
  createdAt: string;
  updatedAt: string;
}
