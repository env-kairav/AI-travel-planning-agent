import { Card } from "@/components/ui/card";
import { resolveIcon } from "@/lib/icon-resolver";
import type { Tip } from "@/lib/types";
import { SectionHeading } from "./day-timeline";

export function TipsSection({ tips, destination }: { tips: Tip[]; destination: string }) {
  if (!tips.length) return null;

  return (
    <section id="tips" className="max-w-5xl mx-auto px-6 py-20 border-t border-border">
      <SectionHeading eyebrow="Be prepared" title={`${destination} Travel Tips`} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-14">
        {tips.slice(0, 6).map((tip, i) => {
          const Icon = resolveIcon(tip.icon);
          return (
            <Card key={i} className="p-6 card-hover">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1.5">{tip.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{tip.text}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
