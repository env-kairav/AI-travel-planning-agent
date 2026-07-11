"use client";

import DOMPurify from "isomorphic-dompurify";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";

/**
 * The backend's TYPE 3 responses are LLM-authored HTML with hardcoded Tailwind
 * classes (e.g. "bg-white/5 rounded-2xl") — but Tailwind's build-time compiler
 * only generates CSS for classes it sees in this repo's source at build time,
 * so those exact ad-hoc classes would render completely unstyled here. Strip
 * all classes/attributes and re-render the structural content inside our own
 * on-brand card instead of trusting the LLM's styling.
 */
export function SnippetCard({ html }: { html: string }) {
  const clean = useMemo(
    () =>
      DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ["p", "strong", "b", "em", "i", "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6", "br", "span", "div", "table", "thead", "tbody", "tr", "td", "th"],
        ALLOWED_ATTR: [],
      }),
    [html],
  );

  return (
    <Card className="p-5 prose prose-invert prose-sm max-w-none [&_strong]:text-primary [&_h1,&_h2,&_h3,&_h4]:font-heading [&_h1,&_h2,&_h3,&_h4]:text-lg [&_h1,&_h2,&_h3,&_h4]:font-semibold [&_h1,&_h2,&_h3,&_h4]:text-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_table]:w-full [&_td]:py-1 [&_th]:text-left [&_th]:text-muted-foreground">
      <div dangerouslySetInnerHTML={{ __html: clean }} />
    </Card>
  );
}
