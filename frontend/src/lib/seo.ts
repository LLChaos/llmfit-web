import type { Metadata } from "next";

/**
 * Site base URL — set via NEXT_PUBLIC_SITE_URL in .env or .env.local.
 * Falls back to localhost:3000 for development.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const SITE_NAME = "LLMFit Web";
export const SITE_DEFAULT_TITLE = "LLMFit Web — Can I Run local LLMs?";
export const SITE_DEFAULT_DESCRIPTION =
  "Find the best local LLMs for your hardware. Auto-detect GPU, VRAM, and RAM — get personalized model recommendations with performance estimates.";

/**
 * Construct page metadata with sensible Open Graph and Twitter defaults.
 */
export function constructMetadata({
  title,
  description,
  path = "/",
  noIndex = false,
}: {
  title: string;
  description: string;
  path?: string;
  noIndex?: boolean;
}): Metadata {
  const url = `${SITE_URL}${path}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

/**
 * Pre-built metadata for static pages.
 */

export const HOME_META = constructMetadata({
  title: "Can I Run local LLMs?",
  description: SITE_DEFAULT_DESCRIPTION,
  path: "/",
});

export const MODELS_META = constructMetadata({
  title: "Model Library",
  description:
    "Browse our comprehensive library of open-source LLMs. Filter by family, parameters, quantization, and VRAM requirements. Find the perfect model for your GPU.",
  path: "/models",
});

export const GPUS_META = constructMetadata({
  title: "GPU Database",
  description:
    "Explore our GPU database with specs for NVIDIA, AMD, Apple, and Intel graphics cards. See which models run on each GPU and find upgrade recommendations.",
  path: "/gpus",
});

export const NEWS_META = constructMetadata({
  title: "Latest News & Guides",
  description:
    "Stay updated on the latest in local LLM deployment. Industry news, site updates, and step-by-step tutorials for running AI models on your own hardware.",
  path: "/news",
});

export const TOOLS_META = constructMetadata({
  title: "Hardware Recommendation Tool",
  description:
    "Detect your PC hardware automatically and get personalized LLM recommendations. See which open-source models can run on your GPU with performance estimates.",
  path: "/tools/recommend",
});

export const ABOUT_META = constructMetadata({
  title: "About Us",
  description:
    "Learn about LLMFit Web — our mission to become the standard reference for local LLM hardware compatibility. Understand our data sources and recommendation methodology.",
  path: "/about",
});

export const CONTACT_META = constructMetadata({
  title: "Contact Us",
  description:
    "Get in touch with the LLMFit Web team. Send feedback, report issues, or ask questions about local LLM deployment and hardware compatibility.",
  path: "/contact",
});

export const PRIVACY_META = constructMetadata({
  title: "Privacy Policy",
  description:
    "LLMFit Web privacy policy. Learn how we handle your data, what information we collect, and your rights as a user.",
  path: "/privacy",
});

export const TERMS_META = constructMetadata({
  title: "Terms of Service",
  description:
    "LLMFit Web terms of service. Read our service disclaimer, intellectual property policy, and terms governing your use of our platform.",
  path: "/terms",
});
