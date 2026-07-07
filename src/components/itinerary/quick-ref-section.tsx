import { Car, Languages, MapPin, Phone, Thermometer } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionEditor } from "@/components/itinerary/section-editor";
import type { ItineraryPlan, QuickRef } from "@/lib/types";

function Row({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-accent-foreground mt-1 flex-shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm text-foreground font-medium">{value}</p>
      </div>
    </div>
  );
}

export function QuickRefSection({
  qr,
  plan,
  onUpdate,
}: {
  qr: QuickRef;
  plan?: ItineraryPlan;
  onUpdate?: (data: QuickRef) => void;
}) {
  return (
    <section className="max-w-4xl mx-auto px-6 py-20 border-t border-border">
      <Card className="p-8 md:p-10 border-primary/20 bg-gradient-to-br from-primary/5 to-card">
        <div className="flex items-center justify-center gap-2 flex-wrap mb-8">
          <h3 className="font-heading text-2xl md:text-3xl font-bold text-foreground text-center">Quick Reference</h3>
          {plan && onUpdate && (
            <SectionEditor<QuickRef>
              section="quick_ref"
              plan={plan}
              placeholder="e.g. double-check the emergency number, add a local SIM card tip"
              onApply={onUpdate}
            />
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-5">
            <Row icon={Phone} label="Emergency" value={qr.emergency} />
            <Row icon={Phone} label="Tourism Helpline" value={qr.tourism_line} />
            <Row icon={Car} label="Local Transport" value={qr.local_cab} />
          </div>
          <div className="space-y-5">
            <Row icon={Thermometer} label="Weather" value={qr.weather} />
            <Row icon={MapPin} label="Base Area" value={qr.base_area} />
            <Row icon={Languages} label="Languages" value={qr.languages} />
          </div>
        </div>
      </Card>
    </section>
  );
}
