import { Bed, Car, Plane, ShoppingBag, Ticket, Utensils } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { CostSummary } from "@/lib/types";
import { BudgetPerPersonSplit, BudgetSplitChart } from "./budget-split-chart";
import { SectionHeading } from "./day-timeline";

function formatInr(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export function BudgetSection({ cost, hotelName, days }: { cost: CostSummary; hotelName: string | null; days: number }) {
  const nights = Math.max(days - 1, 0);
  const cards = [
    { icon: Plane, label: "Flights", sub: "Round trip, per group", amount: cost.breakdown.flights },
    { icon: Bed, label: "Accommodation", sub: `${hotelName ?? "Hotel"} · ${nights} nights`, amount: cost.breakdown.hotel },
    { icon: Utensils, label: "Food & Dining", sub: `${days} days of meals`, amount: cost.breakdown.food },
    { icon: Car, label: "Local Transport", sub: "Cabs, transfers", amount: cost.breakdown.local_transport },
    { icon: Ticket, label: "Activities & Entries", sub: "Experiences, tours", amount: cost.breakdown.activities },
    { icon: ShoppingBag, label: "Shopping & Misc", sub: "Souvenirs, incidentals", amount: null },
  ];

  return (
    <section id="budget" className="max-w-5xl mx-auto px-6 py-20 border-t border-border">
      <SectionHeading eyebrow="Estimated budget" title="Trip Economics" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-14">
        {cards.map((c) => (
          <Card key={c.label} className="p-6 card-hover">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <c.icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">{c.label}</h3>
            <p className="text-sm text-muted-foreground mb-3">{c.sub}</p>
            <p className="text-2xl font-bold text-primary">{c.amount !== null ? formatInr(c.amount) : "₹2,000+"}</p>
          </Card>
        ))}
      </div>

      <BudgetSplitChart cost={cost} />

      <Card className="mt-8 p-8 border-primary/30 bg-gradient-to-r from-primary/5 to-transparent pulse-glow flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-xs text-accent-foreground tracking-widest uppercase mb-1">Total estimated cost</p>
          <p className="text-4xl md:text-5xl font-bold text-foreground">{formatInr(cost.total_inr)}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {cost.travelers} travelers · {days} days · all inclusive
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Per person</p>
          <p className="text-2xl font-bold text-accent-foreground">{formatInr(cost.per_person_inr)}</p>
        </div>
      </Card>
      <BudgetPerPersonSplit cost={cost} />
    </section>
  );
}
