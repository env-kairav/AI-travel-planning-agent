"use client";

import { motion } from "framer-motion";
import { Calendar, MapPin, Users } from "lucide-react";
import { Icon } from "@/components/icon";
import { SectionEditor } from "@/components/itinerary/section-editor";
import type { HeroSectionData, ItineraryPlan } from "@/lib/types";

function formatDateRange(startDate: string | null, days: number): string {
  if (!startDate) return "Flexible dates";
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(start.getDate() + days - 1);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  return `${fmt(start)} – ${fmt(end)}, ${end.getFullYear()}`;
}

export function ItineraryHero({
  plan,
  originCity,
  onUpdate,
}: {
  plan: ItineraryPlan;
  originCity: string;
  onUpdate?: (data: HeroSectionData) => void;
}) {
  const content = plan.itinerary_plan;
  const totalLocations = content.days.reduce((sum, d) => sum + d.activities.length, 0);

  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: `url(https://picsum.photos/seed/${content.hero_image_seed}/1600/900)` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-border mb-8 backdrop-blur-sm"
        >
          <Icon name={content.weather_icon} className="w-4 h-4 text-accent-foreground" />
          <span className="text-xs font-medium text-muted-foreground tracking-wider uppercase">{content.weather_label}</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-heading text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] mb-6"
        >
          <span className="block text-foreground">{originCity}</span>
          <span className="block my-1 shimmer-text">to</span>
          <span className="block text-primary capitalize">{plan.destination}</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center gap-2 flex-wrap mb-8"
        >
          <p className="text-muted-foreground max-w-xl">{content.tagline}</p>
          {onUpdate && (
            <SectionEditor<HeroSectionData>
              section="hero"
              plan={plan}
              placeholder="e.g. make the tagline punchier, or mention the honeymoon vibe"
              onApply={onUpdate}
            />
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-3"
        >
          <Badge icon={<Calendar className="w-4 h-4" />} label={formatDateRange(plan.travel_start_date, plan.days)} />
          <Badge icon={<Users className="w-4 h-4" />} label={`${plan.travelers} travelers`} />
          <Badge icon={<MapPin className="w-4 h-4" />} label={`${totalLocations} stops mapped`} />
        </motion.div>
      </div>
    </section>
  );
}

function Badge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-border backdrop-blur-sm text-sm text-muted-foreground">
      <span className="text-accent-foreground">{icon}</span>
      {label}
    </div>
  );
}
