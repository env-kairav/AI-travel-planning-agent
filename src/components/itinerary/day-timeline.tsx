"use client";

import { motion } from "framer-motion";
import { Clock, Loader2 } from "lucide-react";
import { RichText } from "@/components/rich-text";
import { SectionEditor } from "@/components/itinerary/section-editor";
import { Skeleton } from "@/components/ui/skeleton";
import { dayTheme } from "@/lib/day-theme";
import type { ItineraryDay, ItineraryPlan } from "@/lib/types";

export function DayTimeline({
  days,
  plan,
  onDayUpdate,
  totalDays,
  isGenerating,
}: {
  days: ItineraryDay[];
  plan?: ItineraryPlan;
  onDayUpdate?: (dayIndex: number, data: ItineraryDay) => void;
  /** Requested trip length — used to size the "N more days coming" placeholders
   *  while generation is still in progress. Defaults to `days.length` (nothing
   *  left to placeholder) when omitted, e.g. on the static /share page. */
  totalDays?: number;
  isGenerating?: boolean;
}) {
  const remaining = isGenerating ? Math.max(0, (totalDays ?? days.length) - days.length) : 0;

  return (
    <section id="itinerary" className="max-w-4xl mx-auto px-6 py-20">
      <SectionHeading eyebrow="Day by day" title="Your Itinerary" />
      {isGenerating && (
        <p className="flex items-center justify-center gap-2 text-sm text-accent-foreground mt-4">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          {days.length === 0
            ? "Crafting your day-by-day plan…"
            : `${days.length} of ${totalDays ?? days.length} days ready — still writing the rest…`}
        </p>
      )}

      <div className="space-y-16 mt-14">
        {days.map((day, dayIndex) => {
          const t = dayTheme(day.number);
          return (
            <div key={day.number}>
              <div className="flex items-center gap-5 mb-8">
                <div
                  className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 border pulse-glow"
                  style={{ background: `${t.hex}14`, borderColor: `${t.hex}33` }}
                >
                  <span className="text-xl font-bold" style={{ color: t.hex }}>
                    {String(day.number).padStart(2, "0")}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-xs tracking-widest uppercase mb-1" style={{ color: t.hex }}>
                    {day.weekday} · {day.date}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-heading text-2xl md:text-3xl font-bold text-foreground">{day.title}</h3>
                    {plan && onDayUpdate && (
                      <SectionEditor<ItineraryDay>
                        section="days"
                        sectionIndex={dayIndex}
                        plan={plan}
                        placeholder="e.g. swap the museum for something outdoors, add a beach stop"
                        onApply={(data) => onDayUpdate(dayIndex, data)}
                      />
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm mt-1">{day.subtitle}</p>
                </div>
              </div>

              <div className="relative pl-8 md:pl-10 space-y-5">
                <div
                  className="absolute left-[9px] md:left-[11px] top-2 bottom-2 w-[2px] rounded-full"
                  style={{ background: `linear-gradient(180deg, ${t.hex}, ${t.hex}1a)` }}
                />
                {day.activities.map((act, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    className="relative reveal-on-scroll avoid-print-break"
                  >
                    <div
                      className="absolute -left-8 md:-left-10 top-6 w-5 h-5 rounded-full border-4 border-background"
                      style={{ background: t.hex }}
                    />
                    <div className="rounded-2xl border border-border bg-card p-5 md:p-6 card-hover">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="md:w-40 flex-shrink-0">
                          <div className="flex items-center gap-1.5 mb-2 text-sm font-semibold" style={{ color: t.hex }}>
                            <Clock className="w-3.5 h-3.5" />
                            {act.time}
                          </div>
                          <span
                            className="inline-block text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full"
                            style={{ background: `${t.hex}1a`, border: `1px solid ${t.hex}4d`, color: t.hex }}
                          >
                            {act.type}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground mb-1.5">{act.title}</h4>
                          <RichText html={act.description} className="text-sm text-muted-foreground leading-relaxed" />
                          <div className="flex flex-wrap gap-2 mt-3">
                            {act.chips.map((chip, ci) => (
                              <span key={ci} className="text-[11px] text-muted-foreground bg-white/5 px-2 py-1 rounded">
                                {chip}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
        {Array.from({ length: remaining }).map((_, i) => (
          <GeneratingDayPlaceholder key={`generating-${i}`} dayNumber={days.length + i + 1} />
        ))}
      </div>
    </section>
  );
}

function GeneratingDayPlaceholder({ dayNumber }: { dayNumber: number }) {
  return (
    <div>
      <div className="flex items-center gap-5 mb-8">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 border border-border bg-card">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-xs tracking-widest uppercase mb-1 text-muted-foreground">Generating</p>
          <h3 className="font-heading text-2xl md:text-3xl font-bold text-muted-foreground">Day {dayNumber}</h3>
        </div>
      </div>
      <div className="pl-8 md:pl-10 space-y-5">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    </div>
  );
}

export function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="text-center">
      <p className="text-xs text-accent-foreground tracking-widest uppercase mb-3 font-semibold">{eyebrow}</p>
      <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground">{title}</h2>
    </div>
  );
}
