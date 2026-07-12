import { Suspense } from "react";
import { ChatPanel } from "@/components/chat/chat-panel";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center px-6 py-20 md:py-28">
      <div className="text-center max-w-2xl mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
          <span className="text-xs font-semibold tracking-wider uppercase text-accent-foreground">
            AI-powered trip planning
          </span>
        </div>
        <h1 className="font-heading text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
          <span className="text-foreground">Your next trip,</span>
          <br />
          <span className="shimmer-text">planned in seconds</span>
        </h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-lg mx-auto">
          Tell us where, when, and how — get a full day-by-day itinerary with real
          costs, weather, and an interactive map.
        </p>
      </div>

      <Suspense fallback={null}>
        <ChatPanel />
      </Suspense>
    </main>
  );
}
