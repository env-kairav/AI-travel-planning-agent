"use client";

import DOMPurify from "isomorphic-dompurify";
import { useMemo } from "react";

/**
 * Activity descriptions from the backend may contain <strong> highlights
 * (per the LLM prompt spec) — sanitize with DOMPurify rather than trusting
 * LLM-generated content directly, restricted to a small safe tag allowlist.
 *
 * Uses isomorphic-dompurify (dompurify + jsdom), not the plain browser build —
 * confirmed live: /trips/[id] and /share/[token] are server components, and
 * this gets server-rendered as part of their tree. Plain "dompurify" needs a
 * real DOM (window/document) to construct its sanitizer and throws
 * "sanitize is not a function" under SSR with no DOM available; this doesn't.
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
