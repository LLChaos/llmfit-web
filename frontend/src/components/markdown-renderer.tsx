import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Simple Markdown renderer for news article bodies.
 *
 * Supports: headings (h1-h4), paragraphs, bold, italic, inline code,
 * code blocks (fenced), unordered/ordered lists, links, images,
 * horizontal rules, and blockquotes.
 *
 * Does NOT render raw HTML (security).
 */
export function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  const html = renderMarkdown(content);

  return (
    <article
      className={cn("prose-custom", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ── Markdown → HTML converter ──────────────────────────────────────

function renderMarkdown(md: string): string {
  const lines = md.split("\n");
  const output: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block (``` ... ```)
    if (/^```/.test(line.trim())) {
      const lang = line.trim().slice(3).trim();
      i++;
      const codeLines: string[] = [];
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        codeLines.push(escapeHtml(lines[i]));
        i++;
      }
      const langAttr = lang ? ` class="language-${escapeAttr(lang)}"` : "";
      output.push(`<pre><code${langAttr}>${codeLines.join("\n")}</code></pre>`);
      i++; // skip closing ```
      continue;
    }

    // Blank line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Heading (h1-h4)
    const headingMatch = line.match(/^(#{1,4})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = parseInline(headingMatch[2]);
      const id = headingMatch[2]
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");
      output.push(`<h${level} id="${escapeAttr(id)}">${text}</h${level}>`);
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(---|\*\*\*|___)\s*$/.test(line.trim())) {
      output.push("<hr />");
      i++;
      continue;
    }

    // Blockquote (> ...)
    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      output.push(
        `<blockquote><p>${parseInline(quoteLines.join("\n"))}</p></blockquote>`,
      );
      continue;
    }

    // Unordered list
    if (/^[\-\*\+]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[\-\*\+]\s/.test(lines[i])) {
        items.push(parseInline(lines[i].replace(/^[\-\*\+]\s/, "")));
        i++;
      }
      output.push(`<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(parseInline(lines[i].replace(/^\d+\.\s/, "")));
        i++;
      }
      output.push(`<ol>${items.map((item) => `<li>${item}</li>`).join("")}</ol>`);
      continue;
    }

    // Regular paragraph
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,4}\s|```|[\-\*\+]\s|\d+\.\s|>\s?|---|\*\*\*|___)/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      output.push(`<p>${parseInline(paraLines.join("\n"))}</p>`);
    }
  }

  return output.join("\n");
}

// ── Inline parsing ─────────────────────────────────────────────────

function parseInline(text: string): string {
  // Escape HTML first (but preserve <br> — actually we re-escape everything)
  let result = escapeHtml(text);

  // Bold + Italic (***text***)
  result = result.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");

  // Bold (**text**)
  result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Italic (*text*)
  result = result.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Inline code (`text`)
  result = result.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Links: [text](url)
  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );

  // Images: ![alt](url)
  result = result.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img src="$2" alt="$1" loading="lazy" />',
  );

  return result;
}

// ── Utility ────────────────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
