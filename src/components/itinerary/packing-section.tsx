"use client";

import { Heart, Shirt, Star } from "lucide-react";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Icon } from "@/components/icon";
import { setPackingState } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { Packing, PackingChecklistState } from "@/lib/types";
import { SectionHeading } from "./day-timeline";

/**
 * Persisted to the database (saved_itineraries.packing_state), not localStorage —
 * there's no user auth system, so checklist state can only be owned by something
 * that itself has an identity: the saved itinerary row. If the itinerary hasn't
 * been saved yet (no savedId), checklist state lives in this component's React
 * state only — checked boxes work for the session but don't survive navigating
 * away, which is the honest tradeoff of having no per-user storage otherwise.
 */
function ChecklistColumn({
  icon,
  heading,
  items,
  checked,
  onToggle,
}: {
  icon: React.ReactNode;
  heading: string;
  items: string[];
  checked: Record<number, boolean>;
  onToggle: (index: number) => void;
}) {
  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-accent-foreground uppercase tracking-wider mb-4">
        {icon}
        {heading}
      </h3>
      <div className="space-y-3">
        {items.map((item, i) => (
          <label key={i} className="flex items-center gap-3 cursor-pointer group">
            <Checkbox checked={!!checked[i]} onCheckedChange={() => onToggle(i)} />
            <span
              className={cn(
                "text-sm text-muted-foreground group-hover:text-foreground transition-colors",
                checked[i] && "line-through opacity-40",
              )}
            >
              {item}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

export function PackingSection({
  packing,
  savedId,
  initialState,
}: {
  packing: Packing;
  /** Saved itinerary ID — checklist only persists to the DB once this is set. */
  savedId?: string | null;
  initialState?: PackingChecklistState;
}) {
  const [state, setState] = useState<PackingChecklistState>(initialState ?? {});
  const WeatherIcon = <Icon name={packing.weather_icon} className="w-4 h-4" />;

  function toggle(category: string, index: number) {
    setState((prev) => {
      const next: PackingChecklistState = {
        ...prev,
        [category]: { ...prev[category], [index]: !prev[category]?.[index] },
      };
      if (savedId) {
        setPackingState(savedId, next).catch(() => {
          // best-effort — checkbox already updated visually, a failed PATCH just
          // means this toggle won't survive a reload, not worth interrupting the UI
        });
      }
      return next;
    });
  }

  return (
    <section id="packing" className="max-w-4xl mx-auto px-6 py-20 border-t border-border">
      <SectionHeading eyebrow="Don't forget" title="Packing Checklist" />
      {!savedId && (
        <p className="text-xs text-muted-foreground text-center mt-3">
          Save this itinerary to keep your checklist progress — otherwise it resets when you leave.
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-14">
        <ChecklistColumn
          icon={<Star className="w-4 h-4" />}
          heading="Essentials"
          items={packing.essentials}
          checked={state.essentials ?? {}}
          onToggle={(i) => toggle("essentials", i)}
        />
        <ChecklistColumn
          icon={WeatherIcon}
          heading={packing.weather_category}
          items={packing.weather_items}
          checked={state.weather ?? {}}
          onToggle={(i) => toggle("weather", i)}
        />
        <ChecklistColumn
          icon={<Shirt className="w-4 h-4" />}
          heading="Clothing"
          items={packing.clothing}
          checked={state.clothing ?? {}}
          onToggle={(i) => toggle("clothing", i)}
        />
        <ChecklistColumn
          icon={<Heart className="w-4 h-4" />}
          heading="Health & Misc"
          items={packing.health}
          checked={state.health ?? {}}
          onToggle={(i) => toggle("health", i)}
        />
      </div>
    </section>
  );
}
