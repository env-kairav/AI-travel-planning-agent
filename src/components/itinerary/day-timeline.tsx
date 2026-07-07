"use client";

import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { RichText } from "@/components/rich-text";
import { dayTheme } from "@/lib/day-theme";
import type { ItineraryDay } from "@/lib/types";

export function DayTimeline({ days }: { days: ItineraryDay[] }) {
  return (
    <section id="itinerary" className="max-w-4xl mx-auto px-6 py-20">
      <SectionHeading eyebrow="Day by day" title="Your Itinerary" />

      <div className="space-y-16 mt-14">
        {days.map((day) => {
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
                <div>
                  <p className="text-xs tracking-widest uppercase mb-1" style={{ color: t.hex }}>
                    {day.weekday} · {day.date}
                  </p>
                  <h3 className="font-heading text-2xl md:text-3xl font-bold text-foreground">{day.title}</h3>
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
                    className="relative"
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
      </div>
    </section>
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
