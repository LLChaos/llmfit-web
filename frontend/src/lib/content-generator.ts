/**
 * Content generation utilities for model and GPU detail pages.
 *
 * These functions produce original, human-readable descriptions,
 * pros/cons lists, and FAQs derived from structured data.
 * All output is parameter-driven — no hand-written blurbs — ensuring
 * every model and GPU detail page has unique, SEO-friendly content.
 */

interface ModelData {
  name: string;
  family: string;
  parameterCountB: number;
  quantization: string;
  quantizationBits: number;
  recommendedVramGb: number;
  contextLength: number;
  qualityScore: number;
  hiddenDim?: number;
  numLayers?: number;
}

interface GpuData {
  name: string;
  vendor: string;
  vramGb: number;
  tier: string;
  benchmarkScore?: number;
  flopsTflops?: number;
  memoryBandwidthGbS?: number;
  compatibleModels?: Array<{ name: string; recommendedVramGb: number; qualityScore: number }>;
}

// ── Model content generators ──

export function generateModelDescription(model: ModelData): string {
  const sizeLabel =
    model.parameterCountB >= 30
      ? "large-scale"
      : model.parameterCountB >= 10
        ? "mid-to-large"
        : model.parameterCountB >= 3
          ? "mid-sized"
          : "compact";

  const bitsLabel =
    model.quantizationBits <= 4
      ? `heavily quantized to ${model.quantizationBits}-bit precision`
      : model.quantizationBits <= 8
        ? `quantized to ${model.quantizationBits}-bit precision`
        : "running at full FP16 precision";

  const contextLabel =
    model.contextLength >= 100000
      ? `boasts an impressive ${(model.contextLength / 1000).toFixed(0)}K context window`
      : model.contextLength >= 32000
        ? `features a ${(model.contextLength / 1000).toFixed(0)}K context window`
        : `offers a ${(model.contextLength / 1000).toFixed(0)}K context window`;

  const vramLabel =
    model.recommendedVramGb <= 4
      ? "can run comfortably on entry-level GPUs"
      : model.recommendedVramGb <= 8
        ? "requires a mid-range GPU with sufficient VRAM"
        : model.recommendedVramGb <= 16
          ? "needs a high-end GPU to unlock its full potential"
          : "demands enthusiast-grade hardware for optimal performance";

  return [
    `${model.name} is a ${sizeLabel} model from the ${model.family} family,`,
    `${bitsLabel}.`,
    `With ${model.parameterCountB} billion parameters across ${model.numLayers ?? "multiple"} layers,`,
    `it ${contextLabel} and ${vramLabel}.`,
    model.qualityScore >= 80
      ? `It ranks among the top performers in its class with a quality score of ${model.qualityScore}/100.`
      : model.qualityScore >= 60
        ? `It delivers solid performance with a quality score of ${model.qualityScore}/100.`
        : `It offers entry-level capabilities with a quality score of ${model.qualityScore}/100, making it suitable for resource-constrained environments.`,
  ].join(" ");
}

export function generateModelProsCons(model: ModelData): {
  pros: string[];
  cons: string[];
} {
  const pros: string[] = [];
  const cons: string[] = [];

  // Quality
  if (model.qualityScore >= 80) {
    pros.push(
      `High quality score (${model.qualityScore}/100) — excellent for production use cases`
    );
  } else if (model.qualityScore >= 60) {
    pros.push(`Solid quality score (${model.qualityScore}/100) — reliable for most tasks`);
  } else {
    cons.push(
      `Modest quality score (${model.qualityScore}/100) — may struggle with complex reasoning`
    );
  }

  // VRAM
  if (model.recommendedVramGb <= 6) {
    pros.push(
      `Low VRAM requirement (${model.recommendedVramGb} GB) — runs on most consumer GPUs`
    );
  } else if (model.recommendedVramGb <= 12) {
    pros.push(`Reasonable VRAM requirement (${model.recommendedVramGb} GB) for its size`);
  } else {
    cons.push(
      `High VRAM requirement (${model.recommendedVramGb} GB) — limited to high-end GPUs`
    );
  }

  // Context
  if (model.contextLength >= 100000) {
    pros.push(
      `Extended ${(model.contextLength / 1000).toFixed(0)}K context window — great for long documents`
    );
  } else if (model.contextLength >= 32000) {
    pros.push(
      `Adequate ${(model.contextLength / 1000).toFixed(0)}K context window for most applications`
    );
  } else {
    cons.push(
      `Limited ${(model.contextLength / 1000).toFixed(0)}K context — not ideal for long-form processing`
    );
  }

  // Quantization
  if (model.quantizationBits <= 4) {
    pros.push(
      `Heavily quantized (${model.quantization} — ${model.quantizationBits}-bit) — minimal VRAM footprint`
    );
    cons.push(
      "Heavier quantization may cause slight quality degradation compared to higher-bit versions"
    );
  } else if (model.quantizationBits >= 8) {
    pros.push(
      `High-precision quantization (${model.quantization} — ${model.quantizationBits}-bit) — near-lossless quality`
    );
    cons.push("Higher precision = larger VRAM requirement and slower inference");
  }

  // Size
  if (model.parameterCountB <= 3) {
    pros.push("Compact size — fast inference speeds even on modest hardware");
    cons.push("Smaller parameter count limits performance on complex tasks");
  } else if (model.parameterCountB >= 30) {
    pros.push("Large parameter count — strong reasoning and generation capabilities");
    cons.push("Large model size demands significant VRAM and may run slowly");
  }

  return { pros, cons };
}

export function generateModelFaqs(model: ModelData): Array<{
  question: string;
  answer: string;
}> {
  const faqs: Array<{ question: string; answer: string }> = [
    {
      question: `What hardware do I need to run ${model.name}?`,
      answer: `You need a GPU with at least ${model.recommendedVramGb} GB of VRAM for optimal performance. The minimum VRAM requirement is ${model.recommendedVramGb * 0.75} GB, but we recommend the full ${model.recommendedVramGb} GB to leave headroom for context processing. ${model.parameterCountB} billion parameters at ${model.quantizationBits}-bit quantization means the model weights alone occupy approximately ${(model.parameterCountB * model.quantizationBits / 8).toFixed(1)} GB.`,
    },
    {
      question: `Is ${model.name} the best ${model.family} model for my use case?`,
      answer: `It depends on your priorities. This ${model.quantization}-quantized version balances quality and VRAM efficiency. If you have more VRAM, a higher-bit quantization (Q8_0 or FP16) of the same base model will deliver better quality. If you need faster inference, a lower-bit quantization or a smaller ${model.family} variant may be more suitable.`,
    },
    {
      question: `What is the ${model.quantization} quantization format?`,
      answer: `${model.quantization} is a ${model.quantizationBits}-bit quantization format commonly used in GGUF model files. It compresses model weights to ${model.quantizationBits} bits per parameter, significantly reducing VRAM usage compared to the original FP16 (16-bit) format while preserving most of the model's quality. This format is widely supported by llama.cpp, Ollama, and LM Studio.`,
    },
  ];

  // Context-specific FAQ
  if (model.contextLength >= 100000) {
    faqs.push({
      question: `Can ${model.name} handle very long documents?`,
      answer: `Yes. With a ${(model.contextLength / 1000).toFixed(0)}K context window, ${model.name} can process very long documents, entire codebases, or multi-chapter books in a single session. However, longer contexts consume more VRAM, so ensure your GPU has enough headroom beyond the base model size.`,
    });
  }

  return faqs;
}

// ── GPU content generators ──

export function generateGpuDescription(gpu: GpuData): string {
  const tierLabel =
    gpu.tier === "enthusiast"
      ? "flagship enthusiast-grade"
      : gpu.tier === "high"
        ? "high-performance"
        : gpu.tier === "mid"
          ? "mid-range"
          : "entry-level";

  const vendorLabel =
    gpu.vendor === "nvidia"
      ? "NVIDIA"
      : gpu.vendor === "amd"
        ? "AMD"
        : gpu.vendor === "apple"
          ? "Apple"
          : gpu.vendor === "intel"
            ? "Intel"
            : gpu.vendor;

  const vramLabel =
    gpu.vramGb >= 24
      ? `massive ${gpu.vramGb} GB of VRAM, making it capable of running even the largest open-source LLMs`
      : gpu.vramGb >= 12
        ? `${gpu.vramGb} GB of VRAM, sufficient for most mid-to-large open-source models`
        : gpu.vramGb >= 8
          ? `${gpu.vramGb} GB of VRAM, adequate for compact to mid-sized models`
          : `${gpu.vramGb} GB of VRAM, suitable for small and heavily quantized models`;

  const perfLabel =
    gpu.flopsTflops != null
      ? `It delivers ${gpu.flopsTflops} TFLOPS of FP32 compute performance`
      : "";

  const bandwidthLabel =
    gpu.memoryBandwidthGbS != null
      ? `with ${gpu.memoryBandwidthGbS} GB/s of memory bandwidth`
      : "";

  const compatCount = gpu.compatibleModels?.length ?? 0;

  const compatLabel =
    compatCount > 30
      ? `This GPU can run over ${compatCount} models in our database.`
      : compatCount > 0
        ? `It can run ${compatCount} models in our database.`
        : "";

  return [
    `${gpu.name} is a ${tierLabel} GPU from ${vendorLabel}.`,
    `It offers ${vramLabel}.`,
    perfLabel,
    bandwidthLabel,
    compatLabel,
    gpu.tier === "enthusiast"
      ? "If you're serious about local LLM deployment, this GPU represents the top tier of consumer hardware."
      : gpu.tier === "high"
        ? "It's a solid choice for local LLM enthusiasts who want smooth performance on larger models."
        : gpu.tier === "mid"
          ? "It's the sweet spot for budget-conscious users who still want to run capable local models."
          : "It's a cost-effective entry point for experimenting with local LLMs.",
  ]
    .filter(Boolean)
    .join(" ");
}

export function generateGpuProsCons(gpu: GpuData): {
  pros: string[];
  cons: string[];
} {
  const pros: string[] = [];
  const cons: string[] = [];

  // VRAM
  if (gpu.vramGb >= 24) {
    pros.push(`${gpu.vramGb} GB VRAM — can run virtually all current open-source models`);
  } else if (gpu.vramGb >= 12) {
    pros.push(`${gpu.vramGb} GB VRAM — good for most models up to ~30B parameters`);
  } else if (gpu.vramGb >= 8) {
    pros.push(`${gpu.vramGb} GB VRAM — suitable for compact and mid-sized models`);
  } else {
    cons.push(`${gpu.vramGb} GB VRAM — limited to small and heavily quantized models`);
  }

  // Performance
  if (gpu.flopsTflops != null) {
    if (gpu.flopsTflops >= 40) {
      pros.push(`${gpu.flopsTflops} TFLOPS — exceptional compute for fast token generation`);
    } else if (gpu.flopsTflops >= 15) {
      pros.push(`${gpu.flopsTflops} TFLOPS — solid compute performance`);
    } else {
      cons.push(`${gpu.flopsTflops} TFLOPS — modest compute may limit inference speed`);
    }
  }

  // Bandwidth
  if (gpu.memoryBandwidthGbS != null) {
    if (gpu.memoryBandwidthGbS >= 700) {
      pros.push(`${gpu.memoryBandwidthGbS} GB/s bandwidth — excellent for large models`);
    } else if (gpu.memoryBandwidthGbS >= 300) {
      pros.push(`${gpu.memoryBandwidthGbS} GB/s bandwidth — good memory throughput`);
    } else {
      cons.push(
        `${gpu.memoryBandwidthGbS} GB/s bandwidth — may bottleneck larger model inference`
      );
    }
  }

  // Tier
  if (gpu.tier === "enthusiast") {
    pros.push("Top-tier GPU — best-in-class for local AI workloads");
    cons.push("High cost and power consumption — overkill for casual users");
  } else if (gpu.tier === "entry") {
    pros.push("Affordable entry point for trying local LLMs");
    cons.push("Limited future-proofing — may struggle with next-generation models");
  }

  // Vendor
  if (gpu.vendor === "apple") {
    pros.push("Unified memory architecture — shared RAM/VRAM pool with CPU");
  }

  return { pros, cons };
}

export function generateGpuFaqs(gpu: GpuData): Array<{
  question: string;
  answer: string;
}> {
  const faqs: Array<{ question: string; answer: string }> = [
    {
      question: `What LLM models can I run on ${gpu.name}?`,
      answer: `With ${gpu.vramGb} GB of VRAM, you can run models that require up to approximately ${gpu.vramGb * 0.9} GB of VRAM (leaving some headroom for context). This typically includes models up to ${Math.floor(gpu.vramGb * 1.5)}B parameters in Q4 quantization, or ${Math.floor(gpu.vramGb * 0.75)}B parameters in Q8. Check the compatible models list on this page for specific recommendations.`,
    },
    {
      question: `Is ${gpu.name} good for local LLM inference?`,
      answer: `${gpu.name} is a ${gpu.tier}-tier GPU. ${
        gpu.tier === "enthusiast"
          ? "It's one of the best consumer GPUs for local LLM inference, capable of running large models with fast token generation speeds."
          : gpu.tier === "high"
            ? "It's a strong performer for local LLM inference, handling most models comfortably with good token generation speeds."
            : gpu.tier === "mid"
              ? "It provides a good balance of cost and capability for local LLM inference, suitable for hobbyists and developers."
              : "It's adequate for getting started with local LLMs, though you may be limited to smaller or heavily quantized models."
      }`,
    },
    {
      question: `Should I upgrade from ${gpu.name} for better LLM performance?`,
      answer: gpu.tier === "enthusiast"
        ? `You're already at the top tier. Unless you need more VRAM for extremely large models (70B+), ${gpu.name} should serve you well for the foreseeable future.`
        : gpu.tier === "entry"
          ? `If you're frequently hitting VRAM limits or finding inference speeds too slow, upgrading to a mid-range GPU with 12+ GB VRAM would be a significant improvement. Check our GPU Database for upgrade options.`
          : `If you find yourself wanting to run larger models or need faster inference, consider moving up to the next performance tier. Each tier unlock adds more compatible models and better token generation speeds.`,
    },
  ];

  return faqs;
}
