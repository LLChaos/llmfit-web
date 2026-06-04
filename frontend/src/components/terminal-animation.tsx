"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

// ── Demo script lines ──────────────────────────────────────────

interface TerminalLine {
  text: string;
  style: "prompt" | "output" | "blank";
  delay?: number;
}

function buildScript(
  gpu: string,
  vram: number,
  modelCount: number,
): TerminalLine[] {
  return [
    { text: "> detecting hardware...", style: "prompt" },
    { text: `  GPU: NVIDIA GeForce RTX 4080`, style: "output" },
    { text: `  VRAM:  12 GB `, style: "output" },
    { text: "", style: "blank" },
    {
      text: `> scanning model database (${modelCount} models)...`,
      style: "prompt",
    },
    { text: "  Indexing by VRAM requirements...", style: "output" },
    { text: "  Computing quality scores...", style: "output" },
    { text: "  Benchmarking inference speed...", style: "output" },
    {
      text: `  Found ${Math.floor(modelCount * 0.6)} compatible models`,
      style: "output",
    },
    { text: "", style: "blank" },
    { text: "> ready. Run LLMFit to get recommendations.", style: "prompt" },
  ];
}

// ── Component ──────────────────────────────────────────────────

interface TerminalAnimationProps {
  gpu?: string;
  vram?: number;
  modelCount?: number;
  className?: string;
}

export function TerminalAnimation({
  gpu = "NVIDIA GeForce RTX 4080 Laptop GPU",
  vram = 12,
  modelCount = 50,
  className,
}: TerminalAnimationProps) {
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const rafRef = useRef<number>(0);
  const lastTickRef = useRef<number>(0);
  const pauseUntilRef = useRef<number>(0);

  const script = buildScript(gpu, vram, modelCount);
  const allChars = script.flatMap((line) => [...line.text, "\n"]);

  const scheduleTick = useRef<(ts: number) => void>(() => {});

  const tick = useCallback(
    (timestamp: number) => {
      if (pauseUntilRef.current > timestamp) {
        rafRef.current = requestAnimationFrame(scheduleTick.current);
        return;
      }

      // ~15s typing: ~20 chars/sec
      const interval = 50;
      if (timestamp - lastTickRef.current < interval) {
        rafRef.current = requestAnimationFrame(scheduleTick.current);
        return;
      }
      lastTickRef.current = timestamp;

      setCurrentChar((prev) => {
        const next = prev + 1;
        if (next >= allChars.length) {
          setIsDone(true);
          return prev;
        }

        let charCount = 0;
        for (let i = 0; i < script.length; i++) {
          const lineLen = script[i].text.length + 1;
          if (next >= charCount && next < charCount + lineLen) {
            if (i !== currentLine) {
              setCurrentLine(i);
              if (script[i].delay) {
                pauseUntilRef.current = timestamp + (script[i].delay ?? 0);
              }
            }
            break;
          }
          charCount += lineLen;
        }

        return next;
      });
    },
    [allChars.length, script, currentLine],
  );

  // Keep ref in sync with latest tick (no self-reference lint error)
  useEffect(() => {
    scheduleTick.current = tick;
  });

  useEffect(() => {
    rafRef.current = requestAnimationFrame(scheduleTick.current);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick]);

  // Loop: when done, pause 5s then restart (~30s total cycle: ~25s typing + 5s pause)
  useEffect(() => {
    if (!isDone) return;
    const timer = setTimeout(() => {
      setCurrentLine(0);
      setCurrentChar(0);
      setIsDone(false);
      lastTickRef.current = 0;
      pauseUntilRef.current = 0;
    }, 15000);
    return () => clearTimeout(timer);
  }, [isDone]);

  const rendered = allChars.slice(0, currentChar).join("");

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-2xl overflow-hidden rounded-xl border border-border/30 shadow-lg",
        className,
      )}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 bg-[#EFEEE5] px-4 py-2">
        <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
        <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
        <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
        <span className="ml-2 text-xs font-medium text-[#8b949e] font-mono">
          llmfit ~ inference demo
        </span>
      </div>

      {/* Terminal body */}
      <div className="bg-[#0d1117] p-5 font-mono text-sm leading-relaxed">
        <pre className="m-0 h-[268px] whitespace-pre-wrap break-words text-[#c9d1d9]">
          {rendered}
          {!isDone && (
            <span className="ml-0.5 inline-block h-[1.1em] w-2 animate-pulse bg-[#58a6ff] align-middle" />
          )}
        </pre>
      </div>

      {/* Progress dot row */}
      <div className="flex justify-center gap-1.5 bg-[#161b22] py-2">
        {script.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 w-1.5 rounded-full transition-colors",
              i < currentLine
                ? "bg-[#58a6ff]"
                : i === currentLine
                  ? "bg-[#58a6ff]/60"
                  : "bg-[#30363d]",
            )}
          />
        ))}
      </div>
    </div>
  );
}
