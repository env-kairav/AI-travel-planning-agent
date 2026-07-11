"use client";

import { Bookmark, Download, Globe, Link as LinkIcon, Loader2, Lock, Printer } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { saveItinerary, setItineraryVisibility } from "@/lib/api-client";
import { GoogleCalendarPicker } from "@/components/itinerary/google-calendar-picker";
import type { ItineraryPlanResponse } from "@/lib/types";

/**
 * Save/share depend on the backend's saved_itineraries table (migration.sql) —
 * confirmed during backend work this session that it was never applied to the
 * live Supabase project. The backend degrades gracefully (returns
 * {id: null, error: "..."} rather than a hard error), so this surfaces that as
 * a toast rather than pretending it worked or crashing.
 */
export function ItineraryActionBar({
  plan,
  originCity,
  onSaved,
}: {
  plan: ItineraryPlanResponse["plan"];
  originCity: string;
  /** Fires whenever a save succeeds (including if it was already cached this
   * session) — lets the parent page pass the saved ID down to PackingSection
   * so checklist state can start persisting to the DB. */
  onSaved?: (id: string, shareToken: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [itinId, setItinId] = useState<string | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);

  async function ensureSaved(): Promise<{ id: string; share_token: string } | null> {
    if (itinId && shareToken) return { id: itinId, share_token: shareToken };
    setSaving(true);
    try {
      const result = await saveItinerary({
        title: `${plan.destination} — ${plan.days} days`,
        destination: plan.destination,
        days: plan.days,
        budget: plan.budget,
        travelers: plan.travelers,
        traveler_type: plan.traveler_type,
        cover_image_url: plan.hotel_image_url,
        plan_json: plan,
        is_public: false,
      });
      if (result.error || !result.id) {
        toast.error(result.error ?? "Couldn't save this itinerary right now.");
        return null;
      }
      setItinId(result.id);
      setShareToken(result.share_token);
      toast.success("Itinerary saved");
      onSaved?.(result.id, result.share_token);
      return { id: result.id, share_token: result.share_token };
    } catch {
      toast.error("Couldn't reach the server to save this itinerary.");
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    await ensureSaved();
  }

  async function handleToggleVisibility() {
    const saved = await ensureSaved();
    if (!saved) return;
    const next = !isPublic;
    try {
      await setItineraryVisibility(saved.id, next);
      setIsPublic(next);
      toast.success(next ? "Itinerary is now public" : "Itinerary is now private");
    } catch {
      toast.error("Couldn't update visibility.");
    }
  }

  async function handleCopyLink() {
    const saved = await ensureSaved();
    if (!saved) return;
    const url = `${window.location.origin}/share/${saved.share_token}`;
    await navigator.clipboard.writeText(url);
    toast.success("Share link copied");
  }

  async function handlePdfExport() {
    setExportingPdf(true);
    try {
      // Dynamic import — @react-pdf/renderer is a sizeable dependency this
      // page shouldn't pay for on first load just because the button exists;
      // only fetched when actually clicked.
      const [{ pdf }, { ItineraryPdf }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/lib/pdf/itinerary-pdf"),
      ]);
      const blob = await pdf(<ItineraryPdf plan={plan} originCity={originCity} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${plan.destination.toLowerCase().replace(/\s+/g, "-")}-itinerary.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Couldn't generate the PDF right now.");
    } finally {
      setExportingPdf(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 print:hidden">
      <ActionButton onClick={handleSave} loading={saving} title="Save">
        <Bookmark className="w-5 h-5" />
      </ActionButton>
      <ActionButton onClick={handleToggleVisibility} loading={saving} title={isPublic ? "Make private" : "Make public"}>
        {isPublic ? <Lock className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
      </ActionButton>
      <ActionButton onClick={handleCopyLink} loading={saving} title="Copy share link">
        <LinkIcon className="w-5 h-5" />
      </ActionButton>
      <ActionButton onClick={handlePdfExport} loading={exportingPdf} title="Download PDF">
        <Download className="w-5 h-5" />
      </ActionButton>
      <GoogleCalendarPicker
        days={plan.itinerary_plan.days}
        destination={plan.destination}
        travelStartDate={plan.travel_start_date}
      />
      <ActionButton onClick={() => window.print()} title="Print">
        <Printer className="w-5 h-5" />
      </ActionButton>
    </div>
  );
}

function ActionButton({
  onClick,
  loading,
  title,
  children,
}: {
  onClick: () => void;
  loading?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      size="icon"
      variant="secondary"
      className="h-12 w-12 rounded-full shadow-xl border border-border"
      onClick={onClick}
      title={title}
      disabled={loading}
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : children}
    </Button>
  );
}
