"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Loader2, MapPin, Search, X } from "lucide-react";
import { getDestinations, getDestinationsMeta } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

function toTitleCase(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function FilterRow({
  label,
  options,
  active,
  onChange,
}: {
  label: string;
  options: string[];
  active: string | null;
  onChange: (value: string | null) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider w-24 flex-shrink-0">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange(null)}
          className={cn(
            "text-xs font-medium px-3 py-1.5 rounded-full border transition-colors",
            active === null ? "border-primary/50 bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          All
        </button>
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(active === opt ? null : opt)}
            className={cn(
              "text-xs font-medium px-3 py-1.5 rounded-full border transition-colors capitalize",
              active === opt ? "border-primary/50 bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {toTitleCase(opt)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function DestinationsContent() {
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounced(searchInput, 350);
  const [category, setCategory] = useState<string | null>(null);
  const [purpose, setPurpose] = useState<string | null>(null);

  const { data: meta } = useQuery({
    queryKey: ["destinations-meta"],
    queryFn: getDestinationsMeta,
    staleTime: Infinity,
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["destinations", search, category, purpose],
    queryFn: ({ pageParam }) =>
      getDestinations({ search: search || undefined, category: category ?? undefined, purpose: purpose ?? undefined, limit: PAGE_SIZE, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((n, p) => n + p.data.length, 0);
      return lastPage.has_more ? loaded : undefined;
    },
  });

  const destinations = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);
  const total = data?.pages[0]?.total ?? 0;

  // Infinite scroll — a sentinel div below the grid triggers the next page
  // fetch once it enters the viewport, instead of a manual "Load more" click.
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <main className="flex-1 max-w-6xl mx-auto px-6 py-16 w-full">
      <div className="text-center mb-10">
        <p className="text-xs text-accent-foreground tracking-widest uppercase mb-3 font-semibold">Browse</p>
        <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4">Destinations</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Pick a destination for an instant 5-day plan, or describe your own trip from the home page.
        </p>
      </div>

      <div className="max-w-3xl mx-auto mb-10 space-y-5">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search cities, countries, beach, mountains, tropical…"
            className="w-full rounded-full border border-input bg-transparent pl-11 pr-10 py-3 text-sm outline-none transition-colors hover:border-ring/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {meta && (
          <div className="space-y-3">
            <FilterRow label="Type" options={meta.categories} active={category} onChange={setCategory} />
            <FilterRow label="Trip for" options={meta.purposes} active={purpose} onChange={setPurpose} />
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <p className="text-center text-muted-foreground">Couldn&apos;t load destinations right now — try again shortly.</p>
      ) : destinations.length === 0 ? (
        <p className="text-center text-muted-foreground">No destinations match that search — try a different term or filter.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {destinations.map((dest) => {
              // Used to jump straight to /itinerary with hardcoded defaults
              // (travelers=2, "Your City", flexible dates) — silently skipping
              // origin/dates/group-size instead of asking. Routes through the
              // home page's chat instead, which asks for whatever's actually
              // missing, same as typing "Plan a trip to Goa" would.
              const params = new URLSearchParams({ destination: dest.name });
              return (
                <Link key={dest.id} href={`/?${params}`}>
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
                          <Badge key={tag} variant="secondary" className="text-[10px] capitalize">
                            {toTitleCase(tag)}
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

          <div ref={sentinelRef} className="flex justify-center py-12">
            {isFetchingNextPage ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : !hasNextPage ? (
              <p className="text-sm text-muted-foreground">
                That&apos;s all {total} destination{total === 1 ? "" : "s"} we found — try a different search or filter for more.
              </p>
            ) : null}
          </div>
        </>
      )}
    </main>
  );
}
