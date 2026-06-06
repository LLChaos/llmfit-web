"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useTranslation } from "@/hooks/use-translation";
import { useHardwareDetection } from "@/hooks/use-hardware-detection";
import { ArrowRight, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HomeCtaSection() {
  const { t } = useTranslation();
  const { analyze } = useHardwareDetection();

  const handleDetect = useCallback(async () => {
    // Scroll to top so the hero / results area is visible
    window.scrollTo({ top: 0, behavior: "smooth" });
    await analyze();
  }, [analyze]);

  return (
    <section className="mx-auto max-w-4xl px-4 py-20 text-center">
      <div className="rounded-2xl border border-border/60 bg-gradient-to-b from-muted/50 to-background p-10 sm:p-14">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Cpu className="h-6 w-6 text-primary" />
        </div>
        <h2 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl">
          {t("home.cta_title")}
        </h2>
        <p className="mb-8 text-muted-foreground">
          {t("home.cta_description")}
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            size="lg"
            onClick={handleDetect}
            className="cursor-pointer"
          >
            {t("home.cta_detect")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            nativeButton={false}
            render={<Link href="/models" />}
            className="cursor-pointer"
          >
            {t("home.cta_browse")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
