import Link from "next/link";
import { getDestinations } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import type { Destination } from "@/lib/types";

// Not ISR: the backend is a separately-deployed service, not reachable at Vercel
// build time, so build-time prerendering here would bake in an empty result until
// the next revalidation window. Render fresh per-request instead.
export const dynamic = "force-dynamic";

export default async function DestinationsPage() {
  let destinations: Destination[] = [];
  try {
    destinations = await getDestinations();
  } catch {
    destinations = [];
  }

  return (
    <main className="flex-1 max-w-6xl mx-auto px-6 py-16 w-full">
      <div className="text-center mb-14">
        <p className="text-xs text-accent-foreground tracking-widest uppercase mb-3 font-semibold">Browse</p>
        <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4">Destinations</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Pick a destination for an instant 5-day plan, or describe your own trip from the home page.
        </p>
      </div>

      {destinations.length === 0 ? (
        <p className="text-center text-muted-foreground">Couldn&apos;t load destinations right now — try again shortly.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.map((dest) => {
            const suggestedBudget = Math.max(dest.avg_budget_per_day_inr * 5, 15000);
            const params = new URLSearchParams({
              destination: dest.name,
              days: "5",
              budget: String(suggestedBudget),
              travelers: "2",
              traveler_type: "leisure",
              autostart: "true",
            });
            return (
              <Link key={dest.id} href={`/itinerary?${params}`}>
                <Card className="overflow-hidden card-hover p-0 h-full">
                  <div
                    className="h-44 bg-cover bg-center relative"
                    style={{ backgroundImage: `url(${dest.image_url})` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                    {dest.visa_free_for_indians && (
                      <Badge className="absolute top-3 right-3 bg-primary/90 text-primary-foreground border-none">
                        Visa-free
                      </Badge>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <MapPin className="w-3 h-3" />
                      {dest.country}
                    </div>
                    <h3 className="font-heading text-xl font-semibold text-foreground mb-1">{dest.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-1">{dest.tagline}</p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {dest.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm font-semibold text-primary">
                      ~₹{dest.avg_budget_per_day_inr.toLocaleString("en-IN")}/day
                    </p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
