import { Card } from "@/components/ui/card";
import { Icon } from "@/components/icon";
import { SectionEditor } from "@/components/itinerary/section-editor";
import type { ItineraryPlan, Tip } from "@/lib/types";
import { SectionHeading } from "./day-timeline";

export function TipsSection({
  tips,
  destination,
  plan,
  onUpdate,
}: {
  tips: Tip[];
  destination: string;
  plan?: ItineraryPlan;
  onUpdate?: (data: { tips: Tip[] }) => void;
}) {
  if (!tips.length) return null;

  return (
    <section id="tips" className="max-w-5xl mx-auto px-6 py-20 border-t border-border">
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <SectionHeading eyebrow="Be prepared" title={`${destination} Travel Tips`} />
        {plan && onUpdate && (
          <SectionEditor<{ tips: Tip[] }>
            section="tips"
            plan={plan}
            placeholder="e.g. focus on food, or make these more budget-conscious"
            onApply={onUpdate}
          />
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-14">
        {tips.slice(0, 6).map((tip, i) => (
          <Card key={i} className="p-6 card-hover">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <Icon name={tip.icon} className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1.5">{tip.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{tip.text}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
