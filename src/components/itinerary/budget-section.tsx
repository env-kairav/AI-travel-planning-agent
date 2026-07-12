import { Bed, Bus, Car, CarFront, Plane, ShoppingBag, Ticket, Train, Utensils } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { AccommodationOption, CostSummary } from "@/lib/types";
import { AccommodationPicker } from "./accommodation-picker";
import { BudgetPerPersonSplit, BudgetSplitChart } from "./budget-split-chart";
import { SectionHeading } from "./day-timeline";

function formatInr(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

// The "flights" breakdown line is actually whatever mode_of_transport was
// chosen (estimate_trip_cost applies a per-mode multiplier to the same line
// item rather than adding a separate one) — confirmed live this was
// confusing: picking "train" still showed a "Flights: ₹X" card, which reads
// as if the choice was silently ignored even though the number itself was
// correctly discounted.
const TRANSPORT_DISPLAY: Record<string, { icon: typeof Plane; label: string; sub: string }> = {
  flight: { icon: Plane, label: "Flights", sub: "Round trip, per group" },
  train: { icon: Train, label: "Train Tickets", sub: "Round trip, per group" },
  bus: { icon: Bus, label: "Bus Tickets", sub: "Round trip, per group" },
  own_vehicle: { icon: CarFront, label: "Fuel & Tolls", sub: "Own vehicle, round trip" },
};

export function BudgetSection({
  cost,
  hotelName,
  days,
  modeOfTransport,
  accommodationOptions,
  onSwapAccommodation,
}: {
  cost: CostSummary;
  hotelName: string | null;
  days: number;
  modeOfTransport?: string | null;
  accommodationOptions?: AccommodationOption[];
  onSwapAccommodation?: (option: AccommodationOption) => void;
}) {
  const nights = Math.max(days - 1, 0);
  const transport = TRANSPORT_DISPLAY[modeOfTransport ?? "flight"] ?? TRANSPORT_DISPLAY.flight;
  const cards = [
    { icon: transport.icon, label: transport.label, sub: transport.sub, amount: cost.breakdown.flights },
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
            {c.label === "Accommodation" && onSwapAccommodation && accommodationOptions && (
              <AccommodationPicker options={accommodationOptions} currentHotel={hotelName} onSelect={onSwapAccommodation} />
            )}
          </Card>
        ))}
      </div>

      <BudgetSplitChart cost={cost} modeOfTransport={modeOfTransport} />

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
