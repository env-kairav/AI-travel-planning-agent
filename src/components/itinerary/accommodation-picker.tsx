"use client";

import { Bed, Check, Star } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { AccommodationOption, CostSummary } from "@/lib/types";

function formatInr(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

/**
 * Mirrors estimate_trip_cost's hotel line (tools.py) exactly — hotel cost is
 * `price_per_night * days` (not nights; the backend formula uses the full day
 * count, matched here on purpose) — so swapping stays consistent with what a
 * fresh generation would have computed for the same pick, with zero network
 * round-trip since it's pure arithmetic.
 */
export function recomputeCostForHotel(cost: CostSummary, newPricePerNight: number, days: number): CostSummary {
  const hotel = newPricePerNight * days;
  const breakdown = { ...cost.breakdown, hotel };
  const total_inr = breakdown.flights + breakdown.hotel + breakdown.food + breakdown.activities + breakdown.local_transport;
  return {
    ...cost,
    breakdown,
    total_inr,
    per_person_inr: Math.round(total_inr / cost.travelers),
  };
}

export function AccommodationPicker({
  options,
  currentHotel,
  onSelect,
}: {
  options: AccommodationOption[];
  currentHotel: string | null;
  onSelect: (option: AccommodationOption) => void;
}) {
  const [open, setOpen] = useState(false);
  if (options.length < 2) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="mt-3">
            <Bed className="w-3.5 h-3.5" />
            Change hotel
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose a different stay</DialogTitle>
          <DialogDescription>Swapping updates your budget instantly — no regeneration needed.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto -mx-1 px-1">
          {options.map((opt) => {
            const isCurrent = opt.name === currentHotel;
            return (
              <button
                key={opt.name}
                type="button"
                disabled={isCurrent}
                onClick={() => {
                  onSelect(opt);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:bg-muted disabled:cursor-default disabled:bg-primary/5 disabled:border-primary/30"
              >
                {opt.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={opt.image_url} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Bed className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">{opt.name ?? "Hotel"}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    {opt.rating != null && (
                      <span className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-current" />
                        {opt.rating}
                      </span>
                    )}
                    <span>{opt.price_per_night != null ? `${formatInr(opt.price_per_night)}/night` : "Price on request"}</span>
                  </div>
                </div>
                {isCurrent && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
