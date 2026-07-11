"use client";

import { motion } from "framer-motion";
import { Clock, GripVertical, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { RichText } from "@/components/rich-text";
import { SectionEditor } from "@/components/itinerary/section-editor";
import { Skeleton } from "@/components/ui/skeleton";
import { dayTheme } from "@/lib/day-theme";
import { cn } from "@/lib/utils";
import type { ItineraryDay, ItineraryPlan } from "@/lib/types";

type ActivityLoc = { dayIndex: number; actIndex: number };

export function DayTimeline({
  days,
  plan,
  onDayUpdate,
  onActivityMove,
  totalDays,
  isGenerating,
}: {
  days: ItineraryDay[];
  plan?: ItineraryPlan;
  onDayUpdate?: (dayIndex: number, data: ItineraryDay) => void;
  /** Drag-and-drop reordering/cross-day moves. Undefined disables dragging
   *  entirely (same on/off pattern as onDayUpdate — gated on isComplete by the
   *  caller, since a day's activities array can still be mutated by polling
   *  while the itinerary is streaming in). */
  onActivityMove?: (from: ActivityLoc, to: ActivityLoc) => void;
  /** Requested trip length — used to size the "N more days coming" placeholders
   *  while generation is still in progress. Defaults to `days.length` (nothing
   *  left to placeholder) when omitted, e.g. on the static /share page. */
  totalDays?: number;
  isGenerating?: boolean;
}) {
  const remaining = isGenerating ? Math.max(0, (totalDays ?? days.length) - days.length) : 0;
  const dragEnabled = Boolean(onActivityMove);

  // Drag state lives here (not per-card) since a drop target can be a
  // *different* day's card than the one being dragged. Source and target are
  // tracked in refs (read synchronously by the native listeners below —
  // see that comment), mirrored into state only to drive the dimmed-source-
  // card and insertion-line rendering.
  const dragSourceRef = useRef<ActivityLoc | null>(null);
  const dropTargetRef = useRef<ActivityLoc | null>(null);
  const [dragSourceVisual, setDragSourceVisual] = useState<ActivityLoc | null>(null);
  const [dropTarget, setDropTarget] = useState<ActivityLoc | null>(null);

  // The polyfill instantiates a singleton at module scope that touches
  // `document` unconditionally on import (confirmed by reading its source) —
  // a static top-level import would crash Next.js's server render pass, where
  // `document` doesn't exist. A dynamic import inside an effect only ever
  // executes client-side, after mount. Only loaded when dragging is actually
  // possible — no reason to ship it to /share, which never enables dragging.
  useEffect(() => {
    if (dragEnabled) void import("drag-drop-touch");
  }, [dragEnabled]);

  // dragover/drop are wired via a native (non-React) listener, not JSX
  // onDragOver/onDrop props. Confirmed live by instrumenting a plain
  // document-level listener: React's synthetic dispatch for these two events
  // does not complete synchronously within the native event's own
  // propagation — a document-level bubble-phase listener consistently saw
  // `defaultPrevented === false` even after React's onDragOver handler (which
  // does call preventDefault()) had already logged that it ran. The HTML5 DnD
  // spec requires preventDefault() to land *during* the event's real
  // dispatch for the browser to fire `drop` at all; whatever React does
  // internally for synthetic drag events isn't fast enough for that
  // contract, so `drop` was silently never firing. A native listener
  // attached directly to the DOM (bypassing React's system entirely) doesn't
  // have this gap. dragstart/dragend stay as ordinary JSX props below since
  // they don't require synchronous preventDefault.
  const sectionRef = useRef<HTMLElement>(null);
  const daysRef = useRef(days);
  // Refs must not be written during render (React flags it — concurrent
  // rendering can invoke the render function without committing). Keeping
  // this in sync via a plain effect (no dependency array — runs after every
  // commit) is the standard pattern for "always read the latest value from
  // a native event handler that closed over an earlier render."
  useEffect(() => {
    daysRef.current = days;
  });

  useEffect(() => {
    if (!dragEnabled) return;
    const section = sectionRef.current;
    if (!section) return;

    function resolveTarget(e: DragEvent): ActivityLoc | null {
      const el = e.target as HTMLElement;
      const card = el.closest<HTMLElement>("[data-act-index]");
      if (card) {
        const dayIndex = Number(card.dataset.dayIndex);
        const actIndex = Number(card.dataset.actIndex);
        const rect = card.getBoundingClientRect();
        const before = e.clientY < rect.top + rect.height / 2;
        return { dayIndex, actIndex: before ? actIndex : actIndex + 1 };
      }
      const container = el.closest<HTMLElement>("[data-day-container]");
      if (container) {
        const dayIndex = Number(container.dataset.dayIndex);
        const count = daysRef.current[dayIndex]?.activities.length ?? 0;
        return { dayIndex, actIndex: count };
      }
      return null;
    }

    function onDragOver(e: DragEvent) {
      if (!dragSourceRef.current) return;
      const target = resolveTarget(e);
      if (!target) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
      dropTargetRef.current = target;
      setDropTarget(target);
    }

    function onDrop(e: DragEvent) {
      const source = dragSourceRef.current;
      const target = dropTargetRef.current;
      if (!source || !target) return;
      e.preventDefault();
      onActivityMove?.(source, target);
      dragSourceRef.current = null;
      dropTargetRef.current = null;
      setDragSourceVisual(null);
      setDropTarget(null);
    }

    section.addEventListener("dragover", onDragOver);
    section.addEventListener("drop", onDrop);
    return () => {
      section.removeEventListener("dragover", onDragOver);
      section.removeEventListener("drop", onDrop);
    };
  }, [dragEnabled, onActivityMove]);

  function clearDrag() {
    dragSourceRef.current = null;
    dropTargetRef.current = null;
    setDragSourceVisual(null);
    setDropTarget(null);
  }

  return (
    <section id="itinerary" ref={sectionRef} className="max-w-4xl mx-auto px-6 py-20">
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

              <div
                className="relative pl-8 md:pl-10 space-y-5"
                data-day-container
                data-day-index={dayIndex}
              >
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
                    {dropTarget?.dayIndex === dayIndex && dropTarget.actIndex === i && (
                      <div className="absolute -top-3 left-0 right-0 h-[2px] rounded-full bg-primary" />
                    )}
                    <div
                      className="absolute -left-8 md:-left-10 top-6 w-5 h-5 rounded-full border-4 border-background"
                      style={{ background: t.hex }}
                    />
                    <div
                      // Native HTML5 drag-and-drop only lets the whole
                      // `draggable` element be the drag source — there's no way
                      // to restrict initiation to just the grip icon without a
                      // full pointer-event reimplementation. The grip is a
                      // visual affordance, not the sole handle; this is a known,
                      // accepted trade-off (text selection inside the card is a
                      // little less convenient while dragging is enabled), not
                      // an oversight.
                      draggable={dragEnabled}
                      data-day-index={dayIndex}
                      data-act-index={i}
                      onDragStart={(e) => {
                        // effectAllowed defaults to "uninitialized" — some
                        // browsers then refuse to fire `drop` at all even
                        // when dragover's preventDefault() runs, regardless
                        // of dropEffect. Set explicitly to match dropEffect.
                        e.dataTransfer.effectAllowed = "move";
                        dragSourceRef.current = { dayIndex, actIndex: i };
                        setDragSourceVisual({ dayIndex, actIndex: i });
                      }}
                      onDragEnd={clearDrag}
                      className={cn(
                        "group/activity rounded-2xl border border-border bg-card p-5 md:p-6 card-hover",
                        dragEnabled && "cursor-grab active:cursor-grabbing",
                        dragSourceVisual?.dayIndex === dayIndex && dragSourceVisual.actIndex === i && "opacity-40",
                      )}
                    >
                      <div className="flex flex-col md:flex-row gap-4">
                        {dragEnabled && (
                          <GripVertical className="hidden md:block w-4 h-4 text-muted-foreground/0 group-hover/activity:text-muted-foreground/60 transition-colors flex-shrink-0 -ml-1" />
                        )}
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
                {dropTarget?.dayIndex === dayIndex && dropTarget.actIndex === day.activities.length && (
                  <div className="h-[2px] rounded-full bg-primary" />
                )}
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
