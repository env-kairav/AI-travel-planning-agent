"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** One box in a flow diagram — icon, label, optional one-line sublabel. */
export function FlowNode({
  icon: Icon,
  label,
  sub,
  tone = "default",
  delay = 0,
}: {
  icon: LucideIcon;
  label: string;
  sub?: string;
  tone?: "default" | "primary";
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.35, delay }}
      className={cn(
        "rounded-xl border p-4 flex items-center gap-3 min-w-0",
        tone === "primary" ? "border-primary/40 bg-primary/10" : "border-border bg-card",
      )}
    >
      <div
        className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
          tone === "primary" ? "bg-primary/20" : "bg-white/5",
        )}
      >
        <Icon className={cn("w-4.5 h-4.5", tone === "primary" ? "text-primary" : "text-foreground")} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{label}</p>
        {sub && <p className="text-xs text-muted-foreground truncate">{sub}</p>}
      </div>
    </motion.div>
  );
}

/** A connecting arrow between nodes — animates in slightly after its neighbors. */
export function FlowArrow({ direction = "down", delay = 0 }: { direction?: "down" | "right"; delay?: number }) {
  const Icon = direction === "down" ? ArrowDown : ArrowRight;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.3, delay }}
      className={cn("flex items-center justify-center text-muted-foreground/50", direction === "down" ? "py-1" : "px-1")}
    >
      <Icon className="w-4 h-4" />
    </motion.div>
  );
}

/** Vertical stack of nodes with arrows between them — the common case. */
export function FlowStack({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col">{children}</div>;
}

/** Horizontal row of nodes, wraps on small screens. */
export function FlowRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}
