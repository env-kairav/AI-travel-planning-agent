"use client";

import DOMPurify from "dompurify";
import { useMemo } from "react";

/**
 * Activity descriptions from the backend may contain <strong> highlights
 * (per the LLM prompt spec) — sanitize with DOMPurify rather than trusting
 * LLM-generated content directly, restricted to a small safe tag allowlist.
 */
export function RichText({ html, className }: { html: string; className?: string }) {
  const clean = useMemo(
    () =>
      DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ["strong", "b", "em", "i", "br"],
        ALLOWED_ATTR: [],
      }),
    [html],
  );

  return <span className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
}
