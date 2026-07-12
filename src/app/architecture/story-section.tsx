"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { dayTheme } from "@/lib/day-theme";

/**
 * One "chapter" of the scroll-driven story — a numbered step that fades/slides
 * in once scrolled into view (same whileInView + viewport-once pattern already
 * used for activity cards in day-timeline.tsx, reused here for consistency).
 * `accent` picks a color from the app's existing day-theme palette so each
 * step reads as a distinct beat without introducing a new color system.
 */
export function StorySection({
  step,
  accent,
  icon: Icon,
  title,
  children,
}: {
  step: number;
  accent: number;
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  const t = dayTheme(accent);
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5 }}
      className="max-w-3xl mx-auto px-6 py-16 border-b border-border last:border-b-0"
    >
      <div className="flex items-center gap-3 mb-4">
        <span
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: `${t.hex}22`, color: t.hex }}
        >
          {step}
        </span>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${t.hex}1a` }}>
          <Icon className="w-4.5 h-4.5" style={{ color: t.hex }} />
        </div>
        <h3 className="font-heading font-semibold text-xl text-foreground">{title}</h3>
      </div>
      <div className="pl-[3.75rem]">{children}</div>
    </motion.section>
  );
}
