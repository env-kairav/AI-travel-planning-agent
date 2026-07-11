import { ArrowLeftRight, Car, Languages, MapPin, Phone, Stamp, Stethoscope, Thermometer } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionEditor } from "@/components/itinerary/section-editor";
import type { ItineraryPlan, QuickRef, TravelEssentials } from "@/lib/types";

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

function visaSummary(essentials: TravelEssentials): string {
  const { visa } = essentials;
  if (!visa.required) {
    const validity = visa.days ? ` (valid ${visa.days} days)` : "";
    return `Not required — ${visa.type.replace(/-/g, " ")}${validity}`;
  }
  const processing = visa.processing_days ? `, ~${visa.processing_days} days processing` : "";
  return `Required — ${visa.type.replace(/-/g, " ")}${processing}`;
}

/** Only rendered for a genuinely international trip — nationality/base currency
 * hardcoded to Indian/INR (this app has no other concept of a traveler's
 * actual nationality anywhere else either). */
function TravelEssentialsCard({ essentials }: { essentials: TravelEssentials }) {
  return (
    <div className="mt-8 pt-8 border-t border-border/60">
      <p className="text-xs text-accent-foreground uppercase tracking-wider font-semibold text-center mb-5">
        For Indian passport holders
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Row icon={Stamp} label="Visa" value={visaSummary(essentials)} />
        {essentials.exchange_rate ? (
          <Row
            icon={ArrowLeftRight}
            label="Exchange Rate"
            value={`₹1 = ${essentials.exchange_rate.rate.toFixed(4)} ${essentials.exchange_rate.to_currency}`}
          />
        ) : (
          <Row icon={ArrowLeftRight} label="Exchange Rate" value="Not available right now" />
        )}
      </div>
      {essentials.visa.note && <p className="text-xs text-muted-foreground mt-4 text-center">{essentials.visa.note}</p>}
    </div>
  );
}

export function QuickRefSection({
  qr,
  plan,
  travelEssentials,
  onUpdate,
}: {
  qr: QuickRef;
  plan?: ItineraryPlan;
  travelEssentials?: TravelEssentials | null;
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
            <Row icon={Stethoscope} label="Hospital" value={qr.hospital ?? "Ask your hotel for the nearest hospital"} />
            <Row icon={Car} label="Local Transport" value={qr.local_cab} />
          </div>
          <div className="space-y-5">
            <Row icon={Thermometer} label="Weather" value={qr.weather} />
            <Row icon={MapPin} label="Base Area" value={qr.base_area} />
            <Row icon={Languages} label="Languages" value={qr.languages} />
          </div>
        </div>
        {travelEssentials && <TravelEssentialsCard essentials={travelEssentials} />}
      </Card>
    </section>
  );
}
