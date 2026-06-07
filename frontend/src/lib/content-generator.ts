/**
 * Content generation utilities for model and GPU detail pages.
 *
 * These functions produce original, human-readable descriptions,
 * pros/cons lists, and FAQs derived from structured data.
 * Supports both English (en) and Chinese (zh) output.
 */

type Locale = "zh" | "en";

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

export function generateModelDescription(model: ModelData, locale: Locale = "zh"): string {
  const isZh = locale === "zh";

  const sizeLabel = isZh
    ? (model.parameterCountB >= 30 ? "大规模" : model.parameterCountB >= 10 ? "中大规格" : model.parameterCountB >= 3 ? "中等规模" : "紧凑型")
    : (model.parameterCountB >= 30 ? "large-scale" : model.parameterCountB >= 10 ? "mid-to-large" : model.parameterCountB >= 3 ? "mid-sized" : "compact");

  const bitsLabel = isZh
    ? (model.quantizationBits <= 4 ? `采用 ${model.quantizationBits} 位高压缩量化` : model.quantizationBits <= 8 ? `采用 ${model.quantizationBits} 位量化` : "以 FP16 全精度运行")
    : (model.quantizationBits <= 4 ? `heavily quantized to ${model.quantizationBits}-bit precision` : model.quantizationBits <= 8 ? `quantized to ${model.quantizationBits}-bit precision` : "running at full FP16 precision");

  const contextLabel = isZh
    ? (model.contextLength >= 100000 ? `拥有高达 ${(model.contextLength / 1000).toFixed(0)}K 的超长上下文窗口` : model.contextLength >= 32000 ? `具备 ${(model.contextLength / 1000).toFixed(0)}K 的上下文窗口` : `提供 ${(model.contextLength / 1000).toFixed(0)}K 的上下文窗口`)
    : (model.contextLength >= 100000 ? `boasts an impressive ${(model.contextLength / 1000).toFixed(0)}K context window` : model.contextLength >= 32000 ? `features a ${(model.contextLength / 1000).toFixed(0)}K context window` : `offers a ${(model.contextLength / 1000).toFixed(0)}K context window`);

  const vramLabel = isZh
    ? (model.recommendedVramGb <= 4 ? "可在入门级 GPU 上流畅运行" : model.recommendedVramGb <= 8 ? "需要一张中端显卡及足够的显存" : model.recommendedVramGb <= 16 ? "推荐使用高端 GPU 以充分发挥性能" : "需要旗舰级硬件才能达到最佳性能")
    : (model.recommendedVramGb <= 4 ? "can run comfortably on entry-level GPUs" : model.recommendedVramGb <= 8 ? "requires a mid-range GPU with sufficient VRAM" : model.recommendedVramGb <= 16 ? "needs a high-end GPU to unlock its full potential" : "demands enthusiast-grade hardware for optimal performance");

  const qualitySentence = isZh
    ? (model.qualityScore >= 80 ? `它在同类模型中名列前茅，质量评分 ${model.qualityScore}/100。` : model.qualityScore >= 60 ? `它以 ${model.qualityScore}/100 的质量评分提供可靠性能。` : `它以 ${model.qualityScore}/100 的质量评分提供入门级能力，适合资源受限环境。`)
    : (model.qualityScore >= 80 ? `It ranks among the top performers in its class with a quality score of ${model.qualityScore}/100.` : model.qualityScore >= 60 ? `It delivers solid performance with a quality score of ${model.qualityScore}/100.` : `It offers entry-level capabilities with a quality score of ${model.qualityScore}/100, making it suitable for resource-constrained environments.`);

  const layersText = isZh ? `${model.numLayers ?? "多层"} 网络层` : `${model.numLayers ?? "multiple"} layers`;

  if (isZh) {
    return `${model.name} 是 ${model.family} 家族的一款${sizeLabel}模型，${bitsLabel}。拥有 ${model.parameterCountB} 亿参数，分布于 ${layersText}，${contextLabel}，${vramLabel}。${qualitySentence}`;
  }

  return [
    `${model.name} is a ${sizeLabel} model from the ${model.family} family,`,
    `${bitsLabel}.`,
    `With ${model.parameterCountB} billion parameters across ${model.numLayers ?? "multiple"} layers,`,
    `it ${contextLabel} and ${vramLabel}.`,
    qualitySentence,
  ].join(" ");
}

export function generateModelProsCons(model: ModelData, locale: Locale = "zh"): {
  pros: string[];
  cons: string[];
} {
  const pros: string[] = [];
  const cons: string[] = [];
  const isZh = locale === "zh";

  // Quality
  if (model.qualityScore >= 80) {
    pros.push(isZh
      ? `高质量评分（${model.qualityScore}/100）— 适合生产环境使用`
      : `High quality score (${model.qualityScore}/100) — excellent for production use cases`);
  } else if (model.qualityScore >= 60) {
    pros.push(isZh
      ? `稳定的质量评分（${model.qualityScore}/100）— 适合大多数任务`
      : `Solid quality score (${model.qualityScore}/100) — reliable for most tasks`);
  } else {
    cons.push(isZh
      ? `质量评分一般（${model.qualityScore}/100）— 复杂推理场景可能力不从心`
      : `Modest quality score (${model.qualityScore}/100) — may struggle with complex reasoning`);
  }

  // VRAM
  if (model.recommendedVramGb <= 6) {
    pros.push(isZh
      ? `低显存需求（${model.recommendedVramGb} GB）— 可在大多数消费级 GPU 上运行`
      : `Low VRAM requirement (${model.recommendedVramGb} GB) — runs on most consumer GPUs`);
  } else if (model.recommendedVramGb <= 12) {
    pros.push(isZh
      ? `合理的显存需求（${model.recommendedVramGb} GB）`
      : `Reasonable VRAM requirement (${model.recommendedVramGb} GB) for its size`);
  } else {
    cons.push(isZh
      ? `高显存需求（${model.recommendedVramGb} GB）— 仅限高端 GPU`
      : `High VRAM requirement (${model.recommendedVramGb} GB) — limited to high-end GPUs`);
  }

  // Context
  if (model.contextLength >= 100000) {
    pros.push(isZh
      ? `超长 ${(model.contextLength / 1000).toFixed(0)}K 上下文窗口 — 适合处理长文档`
      : `Extended ${(model.contextLength / 1000).toFixed(0)}K context window — great for long documents`);
  } else if (model.contextLength >= 32000) {
    pros.push(isZh
      ? `充足的 ${(model.contextLength / 1000).toFixed(0)}K 上下文窗口，满足多数应用需求`
      : `Adequate ${(model.contextLength / 1000).toFixed(0)}K context window for most applications`);
  } else {
    cons.push(isZh
      ? `有限的 ${(model.contextLength / 1000).toFixed(0)}K 上下文 — 不适合长文本处理`
      : `Limited ${(model.contextLength / 1000).toFixed(0)}K context — not ideal for long-form processing`);
  }

  // Quantization
  if (model.quantizationBits <= 4) {
    pros.push(isZh
      ? `高压缩量化（${model.quantization} — ${model.quantizationBits} 位）— 显存占用极小`
      : `Heavily quantized (${model.quantization} — ${model.quantizationBits}-bit) — minimal VRAM footprint`);
    cons.push(isZh
      ? "高压缩量化可能带来轻微质量损失"
      : "Heavier quantization may cause slight quality degradation compared to higher-bit versions");
  } else if (model.quantizationBits >= 8) {
    pros.push(isZh
      ? `高精度量化（${model.quantization} — ${model.quantizationBits} 位）— 近乎无损的质量`
      : `High-precision quantization (${model.quantization} — ${model.quantizationBits}-bit) — near-lossless quality`);
    cons.push(isZh
      ? "高精度意味着更大的显存占用和较慢的推理速度"
      : "Higher precision = larger VRAM requirement and slower inference");
  }

  // Size
  if (model.parameterCountB <= 3) {
    pros.push(isZh
      ? "紧凑体量 — 即使在普通硬件上也能快速推理"
      : "Compact size — fast inference speeds even on modest hardware");
    cons.push(isZh
      ? "参数量较小，复杂任务能力有限"
      : "Smaller parameter count limits performance on complex tasks");
  } else if (model.parameterCountB >= 30) {
    pros.push(isZh
      ? "大参数量 — 强大的推理和生成能力"
      : "Large parameter count — strong reasoning and generation capabilities");
    cons.push(isZh
      ? "大模型需要大量显存，运行速度可能较慢"
      : "Large model size demands significant VRAM and may run slowly");
  }

  return { pros, cons };
}

export function generateModelFaqs(model: ModelData, locale: Locale = "zh"): Array<{
  question: string;
  answer: string;
}> {
  const isZh = locale === "zh";

  const weightGb = ((model.parameterCountB * model.quantizationBits) / 8).toFixed(1);

  const faqs: Array<{ question: string; answer: string }> = [
    {
      question: isZh
        ? `运行 ${model.name} 需要什么硬件配置？`
        : `What hardware do I need to run ${model.name}?`,
      answer: isZh
        ? `建议使用至少 ${model.recommendedVramGb} GB 显存的 GPU 以获得最佳性能。最低显存需求为 ${(model.recommendedVramGb * 0.75).toFixed(0)} GB，但我们推荐完整的 ${model.recommendedVramGb} GB 以留出上下文处理的空间。${model.parameterCountB} 亿参数 × ${model.quantizationBits} 位量化，仅模型权重就占用约 ${weightGb} GB。`
        : `You need a GPU with at least ${model.recommendedVramGb} GB of VRAM for optimal performance. The minimum VRAM requirement is ${model.recommendedVramGb * 0.75} GB, but we recommend the full ${model.recommendedVramGb} GB to leave headroom for context processing. ${model.parameterCountB} billion parameters at ${model.quantizationBits}-bit quantization means the model weights alone occupy approximately ${weightGb} GB.`,
    },
    {
      question: isZh
        ? `${model.name} 是 ${model.family} 系列中最好的选择吗？`
        : `Is ${model.name} the best ${model.family} model for my use case?`,
      answer: isZh
        ? `这取决于你的需求优先级。这个 ${model.quantization} 量化版本在质量和显存效率之间取得了平衡。如果你有更多显存，同款模型的高位量化版本（如 Q8_0 或 FP16）会带来更好的质量。如果你需要更快的推理速度，低位量化或更小的 ${model.family} 变体可能更适合。`
        : `It depends on your priorities. This ${model.quantization}-quantized version balances quality and VRAM efficiency. If you have more VRAM, a higher-bit quantization (Q8_0 or FP16) of the same base model will deliver better quality. If you need faster inference, a lower-bit quantization or a smaller ${model.family} variant may be more suitable.`,
    },
    {
      question: isZh
        ? `什么是 ${model.quantization} 量化格式？`
        : `What is the ${model.quantization} quantization format?`,
      answer: isZh
        ? `${model.quantization} 是一种 ${model.quantizationBits} 位量化格式，常用于 GGUF 模型文件。它将模型权�复压缩至每参数 ${model.quantizationBits} 位，相比原始 FP16（16 位）格式大幅降低显存使用，同时保留模型的大部分质量。此格式被 llama.cpp、Ollama 和 LM Studio 广泛支持。`
        : `${model.quantization} is a ${model.quantizationBits}-bit quantization format commonly used in GGUF model files. It compresses model weights to ${model.quantizationBits} bits per parameter, significantly reducing VRAM usage compared to the original FP16 (16-bit) format while preserving most of the model's quality. This format is widely supported by llama.cpp, Ollama, and LM Studio.`,
    },
  ];

  if (model.contextLength >= 100000) {
    faqs.push({
      question: isZh
        ? `${model.name} 能处理超长文档吗？`
        : `Can ${model.name} handle very long documents?`,
      answer: isZh
        ? `可以。凭借 ${(model.contextLength / 1000).toFixed(0)}K 的上下文窗口，${model.name} 能够在单次会话中处理超长文档、整个代码库或多章节书籍。但更长的上下文会消耗更多显存，请确保 GPU 在基础模型之上有足够余量。`
        : `Yes. With a ${(model.contextLength / 1000).toFixed(0)}K context window, ${model.name} can process very long documents, entire codebases, or multi-chapter books in a single session. However, longer contexts consume more VRAM, so ensure your GPU has enough headroom beyond the base model size.`,
    });
  }

  return faqs;
}

// ── GPU content generators ──

export function generateGpuDescription(gpu: GpuData, locale: Locale = "zh"): string {
  const isZh = locale === "zh";

  const tierLabel = isZh
    ? (gpu.tier === "enthusiast" ? "旗舰级" : gpu.tier === "high" ? "高性能" : gpu.tier === "mid" ? "中端" : "入门级")
    : (gpu.tier === "enthusiast" ? "flagship enthusiast-grade" : gpu.tier === "high" ? "high-performance" : gpu.tier === "mid" ? "mid-range" : "entry-level");

  const vendorLabel =
    gpu.vendor === "nvidia" ? "NVIDIA"
    : gpu.vendor === "amd" ? "AMD"
    : gpu.vendor === "apple" ? "Apple"
    : gpu.vendor === "intel" ? "Intel"
    : gpu.vendor;

  const vramLabel = isZh
    ? (gpu.vramGb >= 24
      ? `拥有高达 ${gpu.vramGb} GB 的大容量显存，可以运行当前几乎所有开源大语言模型`
      : gpu.vramGb >= 12
        ? `配备 ${gpu.vramGb} GB 显存，足够运行大多数中大型开源模型`
        : gpu.vramGb >= 8
          ? `具备 ${gpu.vramGb} GB 显存，可运行紧凑型到中等规模的模型`
          : `配备 ${gpu.vramGb} GB 显存，适合小型和高压缩量化的模型`)
    : (gpu.vramGb >= 24
      ? `massive ${gpu.vramGb} GB of VRAM, making it capable of running even the largest open-source LLMs`
      : gpu.vramGb >= 12
        ? `${gpu.vramGb} GB of VRAM, sufficient for most mid-to-large open-source models`
        : gpu.vramGb >= 8
          ? `${gpu.vramGb} GB of VRAM, adequate for compact to mid-sized models`
          : `${gpu.vramGb} GB of VRAM, suitable for small and heavily quantized models`);

  const perfLabel = gpu.flopsTflops != null
    ? (isZh
      ? `它提供 ${gpu.flopsTflops} TFLOPS 的 FP32 计算性能`
      : `It delivers ${gpu.flopsTflops} TFLOPS of FP32 compute performance`)
    : "";

  const bandwidthLabel = gpu.memoryBandwidthGbS != null
    ? (isZh
      ? `，拥有 ${gpu.memoryBandwidthGbS} GB/s 的内存带宽`
      : `with ${gpu.memoryBandwidthGbS} GB/s of memory bandwidth`)
    : "";

  const compatCount = gpu.compatibleModels?.length ?? 0;

  const compatLabel = isZh
    ? (compatCount > 30
      ? `此 GPU 可运行我们数据库中超过 ${compatCount} 个模型。`
      : compatCount > 0
        ? `可以运行数据库中 ${compatCount} 个模型。`
        : "")
    : (compatCount > 30
      ? `This GPU can run over ${compatCount} models in our database.`
      : compatCount > 0
        ? `It can run ${compatCount} models in our database.`
        : "");

  const verdictLabel = isZh
    ? (gpu.tier === "enthusiast"
      ? "如果你认真对待本地 LLM 部署，这款 GPU 代表了消费级硬件的顶级水准。"
      : gpu.tier === "high"
        ? "对于希望在大模型上获得流畅性能的本地 LLM 爱好者来说，这是一个可靠的选择。"
        : gpu.tier === "mid"
          ? "对于预算有限但仍想运行本地模型的用户来说，这是性价比最佳的选择。"
          : "这是尝试本地 LLM 的经济型入门选择。")
    : (gpu.tier === "enthusiast"
      ? "If you're serious about local LLM deployment, this GPU represents the top tier of consumer hardware."
      : gpu.tier === "high"
        ? "It's a solid choice for local LLM enthusiasts who want smooth performance on larger models."
        : gpu.tier === "mid"
          ? "It's the sweet spot for budget-conscious users who still want to run capable local models."
          : "It's a cost-effective entry point for experimenting with local LLMs.");

  return [
    isZh
      ? `${gpu.name} 是 ${vendorLabel} 推出的一款 ${tierLabel} GPU。`
      : `${gpu.name} is a ${tierLabel} GPU from ${vendorLabel}.`,
    isZh ? vramLabel : `It offers ${vramLabel}.`,
    perfLabel,
    bandwidthLabel,
    compatLabel,
    verdictLabel,
  ].filter(Boolean).join(" ");
}

export function generateGpuProsCons(gpu: GpuData, locale: Locale = "zh"): {
  pros: string[];
  cons: string[];
} {
  const pros: string[] = [];
  const cons: string[] = [];
  const isZh = locale === "zh";

  // VRAM
  if (gpu.vramGb >= 24) {
    pros.push(isZh
      ? `${gpu.vramGb} GB 显存 — 几乎可以运行当前所有开源模型`
      : `${gpu.vramGb} GB VRAM — can run virtually all current open-source models`);
  } else if (gpu.vramGb >= 12) {
    pros.push(isZh
      ? `${gpu.vramGb} GB 显存 — 适合大多数最高约 300 亿参数的模型`
      : `${gpu.vramGb} GB VRAM — good for most models up to ~30B parameters`);
  } else if (gpu.vramGb >= 8) {
    pros.push(isZh
      ? `${gpu.vramGb} GB 显存 — 适合小型到中等规模的模型`
      : `${gpu.vramGb} GB VRAM — suitable for compact and mid-sized models`);
  } else {
    cons.push(isZh
      ? `${gpu.vramGb} GB 显存 — 仅限于小型和高压缩量化的模型`
      : `${gpu.vramGb} GB VRAM — limited to small and heavily quantized models`);
  }

  // Performance
  if (gpu.flopsTflops != null) {
    if (gpu.flopsTflops >= 40) {
      pros.push(isZh
        ? `${gpu.flopsTflops} TFLOPS — 强大的计算性能，token 生成速度快`
        : `${gpu.flopsTflops} TFLOPS — exceptional compute for fast token generation`);
    } else if (gpu.flopsTflops >= 15) {
      pros.push(isZh
        ? `${gpu.flopsTflops} TFLOPS — 稳健的计算性能`
        : `${gpu.flopsTflops} TFLOPS — solid compute performance`);
    } else {
      cons.push(isZh
        ? `${gpu.flopsTflops} TFLOPS — 有限的计算能力可能影响推理速度`
        : `${gpu.flopsTflops} TFLOPS — modest compute may limit inference speed`);
    }
  }

  // Bandwidth
  if (gpu.memoryBandwidthGbS != null) {
    if (gpu.memoryBandwidthGbS >= 700) {
      pros.push(isZh
        ? `${gpu.memoryBandwidthGbS} GB/s 带宽 — 适合大模型推理`
        : `${gpu.memoryBandwidthGbS} GB/s bandwidth — excellent for large models`);
    } else if (gpu.memoryBandwidthGbS >= 300) {
      pros.push(isZh
        ? `${gpu.memoryBandwidthGbS} GB/s 带宽 — 良好的内存吞吐`
        : `${gpu.memoryBandwidthGbS} GB/s bandwidth — good memory throughput`);
    } else {
      cons.push(isZh
        ? `${gpu.memoryBandwidthGbS} GB/s 带宽 — 可能成为大模型推理的瓶颈`
        : `${gpu.memoryBandwidthGbS} GB/s bandwidth — may bottleneck larger model inference`);
    }
  }

  // Tier
  if (gpu.tier === "enthusiast") {
    pros.push(isZh
      ? "顶级 GPU — 本地 AI 工作负载的最佳选择"
      : "Top-tier GPU — best-in-class for local AI workloads");
    cons.push(isZh
      ? "高成本和高功耗 — 对普通用户来说可能过剩"
      : "High cost and power consumption — overkill for casual users");
  } else if (gpu.tier === "entry") {
    pros.push(isZh
      ? "价格亲民的本地 LLM 入门选择"
      : "Affordable entry point for trying local LLMs");
    cons.push(isZh
      ? "未来兼容性有限 — 可能难以应对下一代模型"
      : "Limited future-proofing — may struggle with next-generation models");
  }

  // Vendor
  if (gpu.vendor === "apple") {
    pros.push(isZh
      ? "统一内存架构 — 与 CPU 共享 RAM/VRAM 池"
      : "Unified memory architecture — shared RAM/VRAM pool with CPU");
  }

  return { pros, cons };
}

export function generateGpuFaqs(gpu: GpuData, locale: Locale = "zh"): Array<{
  question: string;
  answer: string;
}> {
  const isZh = locale === "zh";

  const tierLabel = isZh
    ? (gpu.tier === "enthusiast" ? "旗舰级" : gpu.tier === "high" ? "高端" : gpu.tier === "mid" ? "中端" : "入门级")
    : gpu.tier;

  const faqs: Array<{ question: string; answer: string }> = [
    {
      question: isZh
        ? `在 ${gpu.name} 上可以运行哪些大语言模型？`
        : `What LLM models can I run on ${gpu.name}?`,
      answer: isZh
        ? `凭借 ${gpu.vramGb} GB 显存，你可以运行需要约 ${(gpu.vramGb * 0.9).toFixed(0)} GB 显存的模型（为上下文处理留出余量）。通常包括 Q4 量化下最高约 ${Math.floor(gpu.vramGb * 1.5)}B 参数的模型，或 Q8 量化下约 ${Math.floor(gpu.vramGb * 0.75)}B 参数的模型。请参阅本页的兼容模型列表获取具体推荐。`
        : `With ${gpu.vramGb} GB of VRAM, you can run models that require up to approximately ${(gpu.vramGb * 0.9).toFixed(0)} GB of VRAM (leaving some headroom for context). This typically includes models up to ${Math.floor(gpu.vramGb * 1.5)}B parameters in Q4 quantization, or ${Math.floor(gpu.vramGb * 0.75)}B parameters in Q8. Check the compatible models list on this page for specific recommendations.`,
    },
    {
      question: isZh
        ? `${gpu.name} 适合本地 LLM 推理吗？`
        : `Is ${gpu.name} good for local LLM inference?`,
      answer: isZh
        ? `${gpu.name} 是一款 ${tierLabel} GPU。${
            gpu.tier === "enthusiast"
              ? "它是消费级 GPU 中本地 LLM 推理的顶级选择之一，能够快速运行大模型。"
              : gpu.tier === "high"
                ? "它在本地 LLM 推理方面表现出色，可以舒适地处理大多数模型，并有良好的 token 生成速度。"
                : gpu.tier === "mid"
                  ? "它在成本和能力之间提供了良好的平衡，适合爱好者和开发者进行本地 LLM 推理。"
                  : "它足以让你入门本地 LLM，但可能局限于小型或高压缩量化的模型。"
          }`
        : `${gpu.name} is a ${gpu.tier}-tier GPU. ${
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
      question: isZh
        ? `我应该从 ${gpu.name} 升级以获得更好的 LLM 性能吗？`
        : `Should I upgrade from ${gpu.name} for better LLM performance?`,
      answer: isZh
        ? (gpu.tier === "enthusiast"
          ? `你已经在顶级了。除非你需要更多显存来运行超大模型（700 亿参数以上），否则 ${gpu.name} 在可预见的未来都能很好地满足你的需求。`
          : gpu.tier === "entry"
            ? `如果你经常遇到显存限制或觉得推理速度太慢，升级到 12GB 以上显存的中端 GPU 将是一个显著的提升。可以在我们的 GPU 数据库中查看升级选项。`
            : `如果你想运行更大的模型或需要更快的推理速度，可以考虑升级到下一个性能级别。每次升级都会解锁更多兼容模型和更好的 token 生成速度。`)
        : (gpu.tier === "enthusiast"
          ? `You're already at the top tier. Unless you need more VRAM for extremely large models (70B+), ${gpu.name} should serve you well for the foreseeable future.`
          : gpu.tier === "entry"
            ? `If you're frequently hitting VRAM limits or finding inference speeds too slow, upgrading to a mid-range GPU with 12+ GB VRAM would be a significant improvement. Check our GPU Database for upgrade options.`
            : `If you find yourself wanting to run larger models or need faster inference, consider moving up to the next performance tier. Each tier unlock adds more compatible models and better token generation speeds.`),
    },
  ];

  return faqs;
}
