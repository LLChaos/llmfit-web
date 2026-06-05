"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface InlineSelectProps {
  /** Current selected value (null = auto / use detected). */
  value: number | null;
  /** Available numeric options to pick from. */
  options: number[];
  /** Unit label appended after the value, e.g. "GB". */
  unit: string;
  /** Called with the selected value, or null for "auto". */
  onChange: (value: number | null) => void;
  /** Text shown when value is null (the "auto" state). */
  autoLabel: string;
  /** Optional class for the trigger element. */
  className?: string;
}

export function InlineSelect({
  value,
  options,
  unit,
  onChange,
  autoLabel,
  className,
}: InlineSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // Portal mounting (SSR safety)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate position from trigger element
  useEffect(() => {
    function updatePosition() {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + 4,
          left: rect.left,
        });
      }
    }
    if (isOpen) {
      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);
    }
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [isOpen]);

  const displayText =
    value !== null ? `${value} ${unit}` : autoLabel;

  const dropdown = isOpen && mounted && (
    <div
      ref={dropdownRef}
      className="fixed z-[9998] min-w-[7rem] rounded-lg border border-border bg-[hsl(var(--card))] p-1 shadow-lg"
      style={{ top: position.top, left: position.left }}
    >
      {/* Auto / reset option */}
      <button
        type="button"
        onClick={() => {
          onChange(null);
          setIsOpen(false);
        }}
        className={cn(
          "flex w-full items-center rounded-md px-3 py-1.5 text-sm cursor-pointer",
          "hover:bg-accent transition-colors",
          value === null
            ? "text-primary font-medium"
            : "text-muted-foreground",
        )}
      >
        {autoLabel}
      </button>

      <div className="my-1 border-t border-border/60" />

      {/* Numeric options */}
      <div className="max-h-48 overflow-y-auto">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => {
              onChange(opt);
              setIsOpen(false);
            }}
            className={cn(
              "flex w-full items-center rounded-md px-3 py-1.5 text-sm cursor-pointer",
              "hover:bg-accent transition-colors",
              value === opt
                ? "text-foreground font-medium bg-accent/50"
                : "text-foreground",
            )}
          >
            {opt} {unit}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium",
          "hover:bg-accent transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          className,
        )}
      >
        <span className="truncate">{displayText}</span>
        <ChevronDown
          className={cn(
            "size-3.5 text-muted-foreground transition-transform duration-150",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {/* Portal-rendered dropdown */}
      {dropdown && createPortal(dropdown, document.body)}
    </>
  );
}
