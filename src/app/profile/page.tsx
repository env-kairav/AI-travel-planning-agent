import Link from "next/link";
import { CalendarDays, Globe, Lock, MapPin, User } from "lucide-react";
import { getMyItineraries } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { SavedItinerary } from "@/lib/types";

// Not ISR: the backend is a separately-deployed service, not reachable at Vercel
// build time — render fresh per-request instead (same reasoning as /destinations).
export const dynamic = "force-dynamic";

function formatDate(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export default async function ProfilePage() {
  let trips: SavedItinerary[] = [];
  try {
    const res = await getMyItineraries();
    trips = res.data;
  } catch {
    trips = [];
  }

  const publicCount = trips.filter((t) => t.is_public).length;

  return (
    <main className="flex-1 max-w-5xl mx-auto px-6 py-16 w-full">
      <Card className="p-6 sm:p-8 mb-14 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
        <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
          <User className="w-9 h-9 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="font-heading text-2xl font-bold text-foreground">Guest</h1>
          <p className="text-sm text-muted-foreground mt-3 max-w-md">
            This app doesn&apos;t have accounts — every trip you plan and save here belongs to this single Guest
            profile, shared by anyone using this app.
          </p>
          <div className="flex items-center justify-center sm:justify-start gap-6 mt-5">
            <div>
              <p className="text-2xl font-bold text-foreground">{trips.length}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Trips saved</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{publicCount}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Public</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="text-center mb-10">
        <p className="text-xs text-accent-foreground tracking-widest uppercase mb-3 font-semibold">Your trips</p>
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3">Saved Itineraries</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Past trips are view-only — open one to see the full plan, or head to the home page to plan a new one.
        </p>
      </div>

      {trips.length === 0 ? (
        <p className="text-center text-muted-foreground">
          No trips saved yet.{" "}
          <Link href="/" className="text-primary underline">
            Plan your first one
          </Link>
          .
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <Link key={trip.id} href={`/trips/${trip.id}`}>
              <Card className="overflow-hidden card-hover p-0 h-full">
                <div
                  className="h-40 bg-cover bg-center relative bg-muted"
                  style={trip.cover_image_url ? { backgroundImage: `url(${trip.cover_image_url})` } : undefined}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                  <Badge
                    className={`absolute top-3 right-3 border-none ${trip.is_public ? "bg-green-600/90 text-white" : "bg-black/60 text-white"}`}
                  >
                    {trip.is_public ? (
                      <>
                        <Globe className="w-3 h-3" /> Public
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3" /> Private
                      </>
                    )}
                  </Badge>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <MapPin className="w-3 h-3" />
                    {trip.destination ?? "Unknown destination"}
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-foreground mb-1 truncate">{trip.title}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-3">
                    <CalendarDays className="w-3 h-3" />
                    {trip.days ? `${trip.days} days` : "—"}
                    {trip.created_at && <span>· Saved {formatDate(trip.created_at)}</span>}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
