"use client";

import { Heart, Shirt, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { resolveIcon } from "@/lib/icon-resolver";
import { cn } from "@/lib/utils";
import type { Packing } from "@/lib/types";
import { SectionHeading } from "./day-timeline";

function ChecklistColumn({
  icon: Icon,
  heading,
  items,
  storageKey,
}: {
  icon: React.ElementType;
  heading: string;
  items: string[];
  storageKey: string;
}) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setChecked(JSON.parse(raw));
    } catch {
      // ignore corrupt/blocked localStorage
    }
  }, [storageKey]);

  function toggle(i: number) {
    setChecked((prev) => {
      const next = { ...prev, [i]: !prev[i] };
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // storage full/blocked — checkbox still works for this session
      }
      return next;
    });
  }

  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-accent-foreground uppercase tracking-wider mb-4">
        <Icon className="w-4 h-4" />
        {heading}
      </h3>
      <div className="space-y-3">
        {items.map((item, i) => (
          <label key={i} className="flex items-center gap-3 cursor-pointer group">
            <Checkbox checked={!!checked[i]} onCheckedChange={() => toggle(i)} />
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

export function PackingSection({ packing, destination }: { packing: Packing; destination: string }) {
  const ns = destination.toLowerCase().replace(/\s+/g, "-");
  const WeatherIcon = resolveIcon(packing.weather_icon);

  return (
    <section id="packing" className="max-w-4xl mx-auto px-6 py-20 border-t border-border">
      <SectionHeading eyebrow="Don't forget" title="Packing Checklist" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-14">
        <ChecklistColumn icon={Star} heading="Essentials" items={packing.essentials} storageKey={`${ns}-packing-essentials`} />
        <ChecklistColumn icon={WeatherIcon} heading={packing.weather_category} items={packing.weather_items} storageKey={`${ns}-packing-weather`} />
        <ChecklistColumn icon={Shirt} heading="Clothing" items={packing.clothing} storageKey={`${ns}-packing-clothing`} />
        <ChecklistColumn icon={Heart} heading="Health & Misc" items={packing.health} storageKey={`${ns}-packing-health`} />
      </div>
    </section>
  );
}
