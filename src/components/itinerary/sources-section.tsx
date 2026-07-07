import { ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { WebSource } from "@/lib/types";
import { SectionHeading } from "./day-timeline";

/**
 * Only rendered when the backend actually used live web search (no curated
 * hotel/restaurant/attraction data for this destination) — empty/absent for
 * well-covered destinations, so this section just doesn't appear for those.
 */
export function SourcesSection({ sources }: { sources: WebSource[] }) {
  if (!sources.length) return null;

  return (
    <section className="max-w-4xl mx-auto px-6 py-20 border-t border-border print:hidden">
      <SectionHeading eyebrow="Where this came from" title="Sources" />
      <p className="text-sm text-muted-foreground text-center max-w-lg mx-auto mt-4">
        This destination doesn&apos;t have curated data yet, so this itinerary was built
        using live web search alongside general knowledge. Worth double-checking
        specifics against these before you book.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
        {sources.map((s) => (
          <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">
            <Card className="p-5 card-hover h-full">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-semibold text-foreground text-sm">{s.title}</h3>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
              </div>
              <p className="text-xs text-muted-foreground line-clamp-3">{s.snippet}</p>
            </Card>
          </a>
        ))}
      </div>
    </section>
  );
}
