"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "@/hooks/use-translation";
import { Card, CardContent } from "@/components/ui/card";
import { Play, RotateCcw, MessageSquare, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Natural language demo ──────────────────────────────────────────
const DEMO_NL_EN = [
  "## Introduction to Local LLM Deployment\n\n",
  "1. Hardware Requirements\n",
  "   Running large language models locally requires careful consideration of your GPU's VRAM capacity. ",
  "For 7B-8B parameter models at 4-bit quantization, you typically need 4-6 GB of VRAM. ",
  "Models in the 13B-14B range demand 8-12 GB, while 30B+ models require 20+ GB of high-bandwidth memory.\n\n",
  "2. Quantization Strategies\n",
  "   Quantization reduces model precision to fit within hardware constraints. Q4_K_M offers the best balance between quality and memory usage. ",
  "Q8_0 provides near-lossless quality at roughly double the memory cost. ",
  "For maximum performance, GGUF formats with offloading layers to GPU while keeping others on CPU RAM enable running larger models than VRAM alone would allow.\n\n",
  "3. Inference Speed Factors\n",
  "   Token generation speed depends primarily on memory bandwidth and compute capability. ",
  "High-end GPUs like the RTX 4090 achieve 80-120 tokens per second on 7B models, ",
  "while mid-range cards like the RTX 3060 typically deliver 20-35 tok/s. ",
  "Context length also impacts performance — processing a 128K context window requires significantly more memory than the default 4K.\n\n",
  "4. Model Selection Guide\n",
  "   For coding tasks, DeepSeek Coder and CodeLlama variants excel at code generation and debugging. ",
  "For creative writing, Qwen and Llama 3 families produce natural, fluent prose. ",
  "For bilingual Chinese-English applications, Qwen and Yi series deliver superior cross-lingual understanding.\n\n",
  "5. Summary\n",
  "   The ideal setup balances model capability with hardware reality. ",
  "Start with a 7B-8B Q4_K_M model as your baseline — it runs on most modern GPUs and provides good quality for everyday tasks. ",
  "Upgrade hardware or reduce quantization only when your specific use case demands it.",
];

const DEMO_NL_ZH = [
  "## 本地部署大语言模型指南\n\n",
  "1. 硬件需求分析\n",
  "   在本地运行大语言模型需要仔细评估 GPU 的显存容量。",
  "7B-8B 参数量的模型采用 4 位量化，通常需要 4-6 GB 显存。",
  "13B-14B 级别的模型需要 8-12 GB，而 30B 以上的模型则需要 20 GB 以上的高带宽显存。\n\n",
  "2. 量化策略选择\n",
  "   量化通过降低模型精度来适配硬件限制。Q4_K_M 在质量和内存占用之间取得了最佳平衡。",
  "Q8_0 提供接近无损的质量，但内存成本大约是前者的两倍。",
  "GGUF 格式支持将部分层加载到 GPU，其余层保留在 CPU 内存中，从而运行超出显存容量的大模型。\n\n",
  "3. 推理速度因素\n",
  "   Token 生成速度主要取决于显存带宽和计算能力。",
  "RTX 4090 等高端显卡在 7B 模型上可达 80-120 tok/s，",
  "而 RTX 3060 等中端显卡通常只能达到 20-35 tok/s。",
  "上下文长度也会影响性能——处理 128K 上下文窗口比默认 4K 需要更多内存资源。\n\n",
  "4. 模型选择建议\n",
  "   编程任务推荐 DeepSeek Coder 和 CodeLlama 系列，在代码生成和调试方面表现出色。",
  "创意写作推荐 Qwen 和 Llama 3 系列，能够生成自然流畅的文本。",
  "中英双语场景推荐 Qwen 和 Yi 系列，具有优越的跨语言理解能力。\n\n",
  "5. 总结建议\n",
  "   理想的配置需要在模型能力和硬件现实之间找到平衡。",
  "建议以 7B-8B Q4_K_M 模型作为基准——它能在大多数现代 GPU 上运行，并提供满足日常需求的生成质量。",
  "只有在特定使用场景需要时，才考虑升级硬件或降低量化精度。",
];

// ── Code demo ──────────────────────────────────────────────────────
const DEMO_CODE = [
  "import asyncio\n",
  "from typing import AsyncIterator\n",
  "from dataclasses import dataclass\n\n",
  "@dataclass\n",
  "class TokenStream:\n",
  "    model: str\n",
  "    temperature: float = 0.7\n",
  "    max_tokens: int = 2048\n\n",
  "    async def generate(\n",
  "        self,\n",
  "        prompt: str,\n",
  "    ) -> AsyncIterator[str]:\n",
  '        """Generate tokens from the model in streaming mode.\n\n',
  "        Yields one token at a time so callers can\n",
  "        display results progressively without waiting\n",
  "        for the full response to complete.\n",
  '        """\n',
  "        tokens_generated = 0\n",
  "        async for token in self._stream(prompt):\n",
  "            tokens_generated += 1\n",
  "            if tokens_generated >= self.max_tokens:\n",
  "                break\n",
  "            yield token\n\n",
  "    async def _stream(\n",
  "        self,\n",
  "        prompt: str,\n",
  "    ) -> AsyncIterator[str]:\n",
  "        # Simulated streaming inference loop\n",
  "        context = self._encode(prompt)\n",
  "        for _ in range(self.max_tokens):\n",
  "            logits = self._forward(context)\n",
  "            token = self._sample(logits, self.temperature)\n",
  "            context = context + [token]\n",
  "            yield self._decode(token)\n",
];

type DemoMode = "nl" | "code";

function tokenize(texts: string[], mode: DemoMode): string[] {
  if (mode === "code") {
    // Code: each line is a token group, plus individual tokens inside lines
    const tokens: string[] = [];
    for (const line of texts) {
      // Split by word boundaries but keep punctuation attached
      const parts = line.split(/(?<=\s)|(?=\s)/).filter(Boolean);
      tokens.push(...parts);
    }
    return tokens;
  }
  // Natural language: raw text split to chars for ZH, words for EN
  return texts.flat(); // Already char-level for ZH via spread in use
}

interface TokenAnimationProps {
  tokensPerSec: number;
  className?: string;
}

export function TokenAnimation({ tokensPerSec, className }: TokenAnimationProps) {
  const { t, locale } = useTranslation();
  const [mode, setMode] = useState<DemoMode>("nl");

  // Build token list based on mode and locale
  const nlTexts = locale === "zh" ? DEMO_NL_ZH : DEMO_NL_EN;

  const getTokens = useCallback((m: DemoMode) => {
    if (m === "code") return tokenize(DEMO_CODE, "code");
    // For NL: split ZH by chars (spread), EN by keeping words+whitespace
    if (locale === "zh") {
      return nlTexts.flatMap((s) => [...s]);
    }
    return nlTexts.flatMap((s) => s.split(/(?<=\s)|(?=\s)/).filter(Boolean));
  }, [locale, nlTexts]);

  const allTokens = useMemo(() => getTokens(mode), [getTokens, mode]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const terminalRef = useRef<HTMLDivElement>(null);

  const totalTokens = allTokens.length;

  // Tick at ~10fps; render more tokens per tick for faster models
  const tickRate = 100;
  const tokensPerTick = Math.max(1, Math.round(tokensPerSec / 10));

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    cleanup();
    setVisibleCount(0);
    setIsDone(false);
    setElapsed(0);
    startTimeRef.current = Date.now();
    setIsRunning(true);

    intervalRef.current = setInterval(() => {
      setVisibleCount((prev) => {
        const next = prev + tokensPerTick;
        if (next >= totalTokens) {
          cleanup();
          setIsRunning(false);
          setIsDone(true);
          setElapsed((Date.now() - startTimeRef.current) / 1000);
          return totalTokens;
        }
        setElapsed((Date.now() - startTimeRef.current) / 1000);
        return next;
      });

      // Auto-scroll terminal to follow generated text
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
    }, tickRate);
  }, [cleanup, totalTokens, tokensPerTick]);

  const reset = useCallback(() => {
    cleanup();
    setVisibleCount(0);
    setIsRunning(false);
    setIsDone(false);
    setElapsed(0);
  }, [cleanup]);

  const switchMode = useCallback((m: DemoMode) => {
    reset();
    setMode(m);
  }, [reset]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const progressPct = totalTokens > 0 ? (visibleCount / totalTokens) * 100 : 0;
  const displayedTokens = allTokens.slice(0, visibleCount);
  const actualTps = isDone ? Math.round(totalTokens / Math.max(elapsed, 0.01)) : tokensPerSec;

  const isCodeMode = mode === "code";

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-0">
        {/* ── Header bar ── */}
        <div className="flex items-center justify-between border-b border-border/50 bg-muted/30 px-3 py-1.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {/* Mode tabs */}
            <div className="flex rounded-md bg-muted p-0.5">
              <button
                onClick={() => switchMode("nl")}
                className={cn(
                  "flex cursor-pointer items-center gap-1 rounded px-2 py-0.5 text-xs font-medium transition-colors",
                  !isCodeMode
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <MessageSquare className="h-3 w-3" />
                NL
              </button>
              <button
                onClick={() => switchMode("code")}
                className={cn(
                  "flex cursor-pointer items-center gap-1 rounded px-2 py-0.5 text-xs font-medium transition-colors",
                  isCodeMode
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Code2 className="h-3 w-3" />
                Code
              </button>
            </div>
            <span className="ml-1 flex h-2 w-2 rounded-full bg-green-500" />
            <span>
              {isDone
                ? t("animation.done")
                : isRunning
                  ? t("animation.generating")
                  : t("animation.ready")}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
            <span>{visibleCount}/{totalTokens} tokens</span>
            <span>{actualTps} tok/s</span>
          </div>
        </div>

        {/* ── Terminal display ── */}
        <div
          ref={terminalRef}
          className={cn(
            "h-72 overflow-y-auto p-4 font-mono text-sm leading-relaxed",
            // Claude Code CLI style: dark navy background, warm white text
            "bg-[#0d1017] text-[#e6e6e6]",
          )}
        >
          {isCodeMode ? (
            // Code mode: render with basic syntax awareness
            <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed">
              <code>
                {displayedTokens.map((token, i) => (
                  <span
                    key={i}
                    className={codeTokenClass(token)}
                  >
                    {token}
                  </span>
                ))}
              </code>
            </pre>
          ) : (
            // NL mode: plain prose
            <div className="whitespace-pre-wrap break-words">
              {displayedTokens.map((token, i) => (
                <span key={i}>{token}</span>
              ))}
            </div>
          )}
          {isRunning && (
            <span className="ml-0.5 inline-block h-[1.1em] w-2 animate-pulse bg-[#e6e6e6] align-middle" />
          )}
          {!isRunning && visibleCount === 0 && (
            <span className="text-[#8b949e]">
              {isCodeMode
                ? "# Click play to see code generation speed..."
                : locale === "zh"
                  ? "# 点击播放按钮演示 token 生成速度..."
                  : "# Click play to demo token generation speed..."}
            </span>
          )}
        </div>

        {/* ── Progress bar ── */}
        <div className="h-1.5 bg-muted/50">
          <div
            className={cn(
              "h-full transition-all duration-75 ease-linear",
              isDone ? "bg-green-500" : "bg-primary",
            )}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* ── Controls ── */}
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{t("model.estimated_speed")}:</span>
            <span className="font-mono font-semibold text-foreground">
              {tokensPerSec} tok/s
            </span>
            {isDone && (
              <span className="font-mono text-green-500">
                ✓ {elapsed.toFixed(1)}s
              </span>
            )}
          </div>
          <button
            onClick={isRunning ? reset : start}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors",
              isRunning
                ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                : "bg-primary/10 text-primary hover:bg-primary/20"
            )}
          >
            {isRunning ? (
              <>
                <RotateCcw className="h-3.5 w-3.5" />
                {t("animation.stop")}
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                {isDone ? t("animation.replay") : t("animation.play")}
              </>
            )}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Basic code syntax coloring ─────────────────────────────────────
function codeTokenClass(token: string): string {
  // Python keywords
  const keywords = /\b(import|from|async|def|class|for|if|in|yield|break|return|self|while|as|None|True|False|and|or|not|with|try|except|raise|pass|elif|else|finally|global|nonlocal|lambda|assert|del|is)\b/;
  // Strings
  const stringLit = /^(['"]).*\1$/;
  // Comments
  const comment = /^#/;
  // Decorators
  const decorator = /^@/;
  // Docstrings
  const docstring = /^"{3}|"{3}$/;

  if (keywords.test(token)) return "text-[#ff7b72]";        // red/pink
  if (docstring.test(token) || token.startsWith('"""')) return "text-[#a5d6ff]";  // light blue
  if (stringLit.test(token)) return "text-[#a5d6ff]";       // light blue
  if (comment.test(token)) return "text-[#8b949e] italic";  // gray italic
  if (decorator.test(token)) return "text-[#d2a8ff]";       // purple
  if (/^\d/.test(token)) return "text-[#79c0ff]";           // blue (numbers)
  if (/^[()[\]{},.:;]$/.test(token.trim())) return "text-[#c9d1d9]"; // light gray
  return ""; // default white-ish
}
