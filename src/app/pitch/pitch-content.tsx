"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Baby,
  Bot,
  Compass,
  DollarSign,
  Map as MapIcon,
  MessageCircle,
  Plug,
  Quote,
  Rocket,
  Save,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Slide = { id: string; eyebrow: string; content: React.ReactNode };

const STACK = [
  { label: "Next.js 16 + React 19", sub: "Frontend" },
  { label: "FastAPI + Python", sub: "Backend" },
  { label: "OpenAI → Gemini → Groq", sub: "LLM fallback chain" },
  { label: "Supabase", sub: "Data + async jobs" },
  { label: "MapLibre + OpenFreeMap", sub: "3D maps, free & keyless" },
  { label: "MCP", sub: "Model Context Protocol server" },
];

const FEATURES = [
  { icon: ShieldCheck, title: "Grounded, not guessed", text: "Real hotels, restaurants, weather, visa rules, and exchange rates — not hallucinated facts." },
  { icon: DollarSign, title: "Budget that responds", text: "Per-person budgeting that actually reacts to your choices — flight vs. train can swing cost by 90%." },
  { icon: Baby, title: "Family-aware", text: "Adults and children asked separately, shaping family-friendly activity picks automatically." },
  { icon: MapIcon, title: "A map that shows the trip", text: "3D routed map with real distances and travel time between every stop, not just pins." },
  { icon: Save, title: "Save, share, revisit", text: "No login required — save a trip, share a read-only link, come back to it anytime." },
  { icon: Plug, title: "MCP-compatible", text: "The same planning tools plug straight into Claude Desktop or any MCP client." },
];

export function PitchContent() {
  const slides: Slide[] = [
    {
      id: "title",
      eyebrow: "",
      content: (
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-8">
            <Compass className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-5xl md:text-7xl font-bold text-foreground mb-6">TripNest</h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-xl mx-auto">
            A conversation that turns into a fully planned, grounded trip.
          </p>
        </div>
      ),
    },
    {
      id: "problem",
      eyebrow: "The problem",
      content: (
        <div className="max-w-2xl">
          <AlertTriangle className="w-10 h-10 text-primary mb-6" />
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-6">
            Planning a trip is a dozen open tabs
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Budget math in one tab, hotel reviews in another, weather in a third, visa rules somewhere else — and
            generic AI chatbots make it worse by confidently inventing hotel names, wrong emergency numbers, and
            costs with no connection to what you actually asked for.
          </p>
        </div>
      ),
    },
    {
      id: "solution",
      eyebrow: "The solution",
      content: (
        <div className="max-w-2xl">
          <Sparkles className="w-10 h-10 text-primary mb-6" />
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-6">
            One conversation. A real, grounded itinerary.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            TripNest asks only what&apos;s actually missing, then builds a full day-by-day plan backed by real
            data — not a plausible-sounding guess. Budget, transport, weather, visas, and every recommendation are
            grounded in something real, and cited when they come from a live source.
          </p>
        </div>
      ),
    },
    {
      id: "how",
      eyebrow: "How it works",
      content: (
        <div className="max-w-2xl">
          <MessageCircle className="w-10 h-10 text-primary mb-6" />
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-8">
            From a message to a mapped-out trip
          </h2>
          <div className="flex flex-col gap-4">
            {[
              "You describe the trip (or just pick a destination to browse) — as little or as much detail as you want",
              "A few quick questions fill in what's missing: dates, budget, who's coming, what you're after, how you're traveling",
              "The trip streams in live — hero and tips first, then each day",
              "A 3D map, real budget breakdown, packing list, and cited sources round it out",
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="w-7 h-7 rounded-full bg-primary/15 text-primary text-sm font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <p className="text-muted-foreground">{step}</p>
              </div>
            ))}
          </div>
          <Link href="/architecture" className="inline-flex items-center gap-1.5 text-primary text-sm font-medium mt-8 hover:underline">
            See the full architecture <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ),
    },
    {
      id: "features",
      eyebrow: "What makes it different",
      content: (
        <div className="max-w-3xl w-full">
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-10 text-center">
            Built to be trusted, not just clever
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-card p-5 text-left">
                <f.icon className="w-5 h-5 text-primary mb-3" />
                <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "stack",
      eyebrow: "Under the hood",
      content: (
        <div className="max-w-2xl w-full">
          <Bot className="w-10 h-10 text-primary mb-6" />
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-8">
            The stack
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {STACK.map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-card p-4 text-left">
                <p className="font-semibold text-foreground text-sm">{s.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "vision",
      eyebrow: "What's next",
      content: (
        <div className="max-w-2xl">
          <Rocket className="w-10 h-10 text-primary mb-6" />
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-6">
            Where this goes next
          </h2>
          <ul className="text-lg text-muted-foreground leading-relaxed space-y-3 list-disc list-inside">
            <li>Real accounts — trip history and preferences that carry across devices</li>
            <li>Live pricing — real-time flight and hotel rates instead of estimates</li>
            <li>Deeper personalization from past trips, not just style tags</li>
            <li>More destinations with curated, first-party data</li>
          </ul>
        </div>
      ),
    },
    {
      id: "close",
      eyebrow: "",
      content: (
        <div className="text-center">
          <Quote className="w-8 h-8 text-primary/60 mx-auto mb-6" />
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-8">
            Plan your next trip in one conversation.
          </h2>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium hover:opacity-90 transition-opacity"
          >
            Start planning <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ),
    },
  ];

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const goTo = useCallback(
    (next: number) => {
      if (next < 0 || next >= slides.length) return;
      setDirection(next > index ? 1 : -1);
      setIndex(next);
    },
    [index, slides.length],
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight") goTo(index + 1);
      if (e.key === "ArrowLeft") goTo(index - 1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [index, goTo]);

  return (
    <div className="relative overflow-hidden min-h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={slides[index].id}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.35 }}
            className="w-full flex flex-col items-center"
          >
            {slides[index].eyebrow && (
              <p className="text-xs text-accent-foreground tracking-widest uppercase mb-4 font-semibold text-center">
                {slides[index].eyebrow}
              </p>
            )}
            {slides[index].content}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="sticky bottom-0 border-t border-border bg-background/80 backdrop-blur-xl py-4 px-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Prev
        </button>

        <div className="flex items-center gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-6 bg-primary" : "w-1.5 bg-border hover:bg-muted-foreground",
              )}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => goTo(index + 1)}
          disabled={index === slides.length - 1}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          Next <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
