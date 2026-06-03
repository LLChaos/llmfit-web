import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — LLMFit Web",
  description: "Content management dashboard for LLMFit Web.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
