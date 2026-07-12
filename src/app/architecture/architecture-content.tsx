"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Server, LayoutPanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { FrontendStory } from "./frontend-story";
import { BackendStory } from "./backend-story";

type Tab = "frontend" | "backend";

const TABS: { id: Tab; label: string; icon: typeof Server }[] = [
  { id: "frontend", label: "Frontend", icon: LayoutPanelLeft },
  { id: "backend", label: "Backend", icon: Server },
];

export function ArchitectureContent() {
  const [tab, setTab] = useState<Tab>("frontend");

  return (
    <div>
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-10 text-center">
        <p className="text-xs text-accent-foreground tracking-widest uppercase mb-3 font-semibold">How it works</p>
        <h1 className="font-heading text-4xl md:text-6xl font-bold text-foreground mb-5">
          Behind the trip
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          A look at how TripNest actually turns &ldquo;weekend trip to Manali&rdquo; into a full, grounded,
          day-by-day itinerary — from the first message to the map on your screen.
        </p>
      </section>

      <div className="sticky top-16 z-40 backdrop-blur-xl bg-background/80 border-y border-border py-4">
        <div className="flex items-center justify-center gap-2">
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors",
                  isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="architecture-tab-pill"
                    className="absolute inset-0 rounded-full bg-primary"
                    transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
                  />
                )}
                <Icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="py-4">{tab === "frontend" ? <FrontendStory /> : <BackendStory />}</div>
    </div>
  );
}
