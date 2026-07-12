"use client";

import { useId, useState } from "react";
import type { CostSummary } from "@/lib/types";

/**
 * Categorical palette derived from this app's existing day-theme hues
 * (orange/blue/green/purple/pink — see src/lib/day-theme.ts), re-validated for
 * this chart's specific dark surface (#030303) via the dataviz skill's
 * validate_palette.js — the app-wide brand shades were too light for the
 * categorical lightness band (L 0.48-0.67 on dark), so these are one step
 * darker per hue, holding the same hue family. Fixed order = the CVD-safety
 * mechanism; never reorder or cycle.
 */
const CATEGORY_COLOR = {
  flights: "#c2410c",
  hotel: "#3b82f6",
  food: "#15803d",
  local_transport: "#a855f7",
  activities: "#ec4899",
} as const;

// The "flights" segment is really whatever mode_of_transport was chosen (see
// budget-section.tsx's TRANSPORT_DISPLAY) — labeled dynamically so this chart
// doesn't say "Flights" for a trip explicitly taken by train/bus/own vehicle.
const TRANSPORT_LABEL: Record<string, string> = {
  flight: "Flights",
  train: "Train Tickets",
  bus: "Bus Tickets",
  own_vehicle: "Fuel & Tolls",
};

function formatInr(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export function BudgetSplitChart({ cost, modeOfTransport }: { cost: CostSummary; modeOfTransport?: string | null }) {
  const total = cost.total_inr;
  const tooltipId = useId();
  const [hovered, setHovered] = useState<string | null>(null);
  const categoryLabel: Record<keyof typeof CATEGORY_COLOR, string> = {
    flights: TRANSPORT_LABEL[modeOfTransport ?? "flight"] ?? TRANSPORT_LABEL.flight,
    hotel: "Accommodation",
    food: "Food & Dining",
    local_transport: "Local Transport",
    activities: "Activities",
  };

  if (total <= 0) return null;

  const segments = (Object.keys(CATEGORY_COLOR) as (keyof typeof CATEGORY_COLOR)[])
    .map((key) => ({
      key,
      label: categoryLabel[key],
      color: CATEGORY_COLOR[key],
      amount: cost.breakdown[key],
      pct: cost.breakdown[key] / total,
    }))
    .filter((s) => s.amount > 0);

  return (
    <div className="mt-8">
      <p className="text-xs text-accent-foreground tracking-widest uppercase mb-4 font-semibold text-center">
        Where the budget goes
      </p>

      {/* The stacked bar itself — each segment is its own hover/focus target per
          the dataviz skill's interaction spec (mark IS the hit target, no crosshair
          needed for a single bar). 2px surface gaps between segments, 4px rounded
          caps only at the two outer ends. */}
      <div className="flex h-6 w-full rounded-[4px] overflow-hidden gap-[2px]" role="img" aria-label={`Budget breakdown: ${segments.map((s) => `${s.label} ${Math.round(s.pct * 100)}%`).join(", ")}`}>
        {segments.map((s, i) => {
          const isHovered = hovered === s.key;
          // Direct label only if the segment is comfortably wide enough for its
          // text — never clipped. ~9% of the bar is the rough floor for a short
          // percentage label at this bar height; anything narrower relies on the
          // legend + tooltip instead (per marks-and-anatomy.md's "measure first").
          const showInlineLabel = s.pct >= 0.14;
          return (
            <button
              key={s.key}
              type="button"
              className="relative flex items-center justify-center transition-[filter] outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{
                width: `${s.pct * 100}%`,
                background: s.color,
                filter: isHovered ? "brightness(1.15)" : undefined,
                borderTopLeftRadius: i === 0 ? 4 : 0,
                borderBottomLeftRadius: i === 0 ? 4 : 0,
                borderTopRightRadius: i === segments.length - 1 ? 4 : 0,
                borderBottomRightRadius: i === segments.length - 1 ? 4 : 0,
              }}
              onPointerEnter={() => setHovered(s.key)}
              onPointerLeave={() => setHovered((h) => (h === s.key ? null : h))}
              onFocus={() => setHovered(s.key)}
              onBlur={() => setHovered((h) => (h === s.key ? null : h))}
              aria-describedby={isHovered ? tooltipId : undefined}
            >
              {showInlineLabel && (
                <span className="text-[11px] font-semibold text-white/95 pointer-events-none">
                  {Math.round(s.pct * 100)}%
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tooltip — value leads (Strong), label follows, per interaction.md. Every
          value here is also reachable without hovering: it's already in the card
          grid above and the legend below. */}
      <div className="h-6 mt-2 text-center" id={tooltipId} role="status">
        {hovered && (
          <p className="text-sm">
            <span className="font-bold text-foreground">{formatInr(segments.find((s) => s.key === hovered)!.amount)}</span>
            <span className="text-muted-foreground"> · {categoryLabel[hovered as keyof typeof CATEGORY_COLOR]}</span>
          </p>
        )}
      </div>

      {/* Legend — always present for 2+ series, the dependable identity channel
          direct labels alone aren't required to carry. Line-key (swatch), not a
          filled box competing with the mark itself. */}
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-1">
        {segments.map((s) => (
          <div key={s.key} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function BudgetPerPersonSplit({ cost }: { cost: CostSummary }) {
  if (cost.travelers <= 1) return null;

  // A row of `travelers` identical chips (same even-split amount repeated N
  // times) restates the same number without adding information — especially
  // noisy for larger groups. One compact "N × amount" line is the honest,
  // non-redundant way to make the split explicit beyond the single per-person
  // figure already in the total banner above.
  return (
    <p className="text-center text-sm text-muted-foreground mt-6">
      Split evenly: <span className="text-foreground font-semibold">{cost.travelers} × {formatInr(cost.per_person_inr)}</span> each
    </p>
  );
}
