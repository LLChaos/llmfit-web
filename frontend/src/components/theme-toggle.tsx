"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { useThemeStore } from "@/stores/theme-store";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const resolved = useThemeStore((s) => s.resolved);
  const toggle = useThemeStore((s) => s.toggle);
  const isDark = resolved === "dark";

  // Only render the correct icon after client mount to prevent hydration mismatch.
  // Server always renders a placeholder — client replaces it with Sun or Moon
  // based on the actual theme (which may differ due to localStorage / system preference).
  useEffect(() => {
    setMounted(true); // eslint-disable-line react-hooks/set-state-in-effect -- intentional mount detection, fires once
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch theme"
      className={cn(
        "flex h-8 w-8 cursor-pointer items-center justify-center rounded-full",
        "text-muted-foreground hover:text-foreground transition-colors",
        "hover:bg-accent",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
      )}
    >
      {mounted ? (
        isDark ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )
      ) : (
        <span className="h-4 w-4" />
      )}
    </button>
  );
}
