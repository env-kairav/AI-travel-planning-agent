"use client";

import { AlertTriangle, Globe, MapPinCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import type { GroundingReport } from "@/lib/types";

const LEVEL_CONFIG: Record<
  GroundingReport["level"],
  { icon: typeof MapPinCheck; label: string; hex: string }
> = {
  verified: { icon: MapPinCheck, label: "Grounded in real local data", hex: "#22c55e" },
  web_researched: { icon: Globe, label: "Researched from the web", hex: "#3b82f6" },
  // Deliberately not red/alarm-colored — an AI-estimated trip is the normal,
  // expected outcome for a less-covered destination, not an error state.
  estimated: { icon: Sparkles, label: "AI-estimated — worth double-checking key details", hex: "#a3a3a3" },
};

export function GroundingBadge({ grounding }: { grounding?: GroundingReport }) {
  const [expanded, setExpanded] = useState(false);
  if (!grounding) return null;

  const { icon: Icon, label, hex } = LEVEL_CONFIG[grounding.level];
  const hasAnomalies = grounding.anomalies.length > 0;

  return (
    <div className="flex flex-col items-center gap-2 print:hidden">
      <div
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-medium"
        style={{ borderColor: `${hex}40`, background: `${hex}14`, color: hex }}
      >
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      {hasAnomalies && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2 flex items-center gap-1"
        >
          <AlertTriangle className="w-3 h-3" />
          {expanded ? "Hide details" : `${grounding.anomalies.length} thing${grounding.anomalies.length > 1 ? "s" : ""} to double-check`}
        </button>
      )}
      {expanded && hasAnomalies && (
        <ul className="text-[11px] text-muted-foreground text-center space-y-0.5 max-w-md">
          {grounding.anomalies.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
