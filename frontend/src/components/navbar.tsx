"use client";

import { LanguageSwitcher } from "@/components/language-switcher";
import { Cpu } from "lucide-react";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border/40 bg-muted/30 backdrop-blur-sm">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4">
        {/* Brand */}
        <a href="/" className="flex items-center gap-2 text-sm font-semibold text-foreground/80 hover:text-foreground transition-colors">
          <Cpu className="h-4 w-4 text-primary" />
          <span>LLMFit Web</span>
        </a>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
        </div>
      </div>
    </nav>
  );
}
