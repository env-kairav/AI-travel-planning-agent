"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ItineraryPlan } from "@/lib/types";

/** Print is fully wired here; save/share/calendar wiring lands in the next phase. */
export function ItineraryActionBar({ plan }: { plan: ItineraryPlan }) {
  void plan;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 print:hidden">
      <Button size="icon" variant="secondary" className="h-12 w-12 rounded-full shadow-xl" onClick={() => window.print()} title="Print">
        <Printer className="w-5 h-5" />
      </Button>
    </div>
  );
}
