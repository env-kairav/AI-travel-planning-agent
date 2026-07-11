"use client";

import { Loader2, PiggyBank, Sparkles, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export type Tier = "primary" | "budget" | "luxury";

const TIER_META: Record<Tier, { label: string; icon: typeof Sun }> = {
  primary: { label: "This Trip", icon: Sun },
  budget: { label: "Budget Version", icon: PiggyBank },
  luxury: { label: "Luxury Version", icon: Sparkles },
};

/**
 * Real on-demand alternate itineraries, not a relabeled version of the same
 * plan — picking an unvisited tier kicks off a genuine second generation
 * (different budget, and for luxury a nudged traveler_type) via its own
 * useItineraryGeneration instance. Only rendered once the primary trip is
 * complete — exploring alternates before you've seen the main trip doesn't
 * make sense, and each tier's own generation reuses the same progressive
 * loading UI once selected.
 */
export function TierSwitcher({
  active,
  onChange,
  loadingTiers,
}: {
  active: Tier;
  onChange: (tier: Tier) => void;
  /** Tiers currently generating (already selected once, not yet complete) —
   *  shows a small spinner on that pill instead of blocking the switch. */
  loadingTiers: Set<Tier>;
}) {
  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      {(Object.keys(TIER_META) as Tier[]).map((tier) => {
        const { label, icon: Icon } = TIER_META[tier];
        const isActive = tier === active;
        const isLoadingTier = loadingTiers.has(tier) && !isActive;
        return (
          <button
            key={tier}
            type="button"
            onClick={() => onChange(tier)}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-white/5 border-border text-muted-foreground hover:text-foreground hover:bg-white/10",
            )}
          >
            {isLoadingTier ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
            {label}
          </button>
        );
      })}
    </div>
  );
}
