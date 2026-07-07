"use client";

import { Loader2, Pencil, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ClarificationForm } from "@/components/chat/clarification-form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, regenerateSection } from "@/lib/api-client";
import type { ClarificationPrompt, ItineraryPlan } from "@/lib/types";

type EditableSection = "days" | "tips" | "packing" | "hero" | "quick_ref";

/**
 * Reusable "edit this section" affordance — a pencil icon that opens an inline
 * prompt, calls /api/itinerary/section, and either applies the regenerated
 * content (via onApply) or shows a clarifying question first (reusing the same
 * ClarificationForm the main chat flow uses — same __clarify__ contract).
 */
export function SectionEditor<T>({
  section,
  sectionIndex,
  plan,
  placeholder,
  onApply,
}: {
  section: EditableSection;
  sectionIndex?: number;
  plan: ItineraryPlan;
  placeholder?: string;
  onApply: (data: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [clarification, setClarification] = useState<ClarificationPrompt | null>(null);
  const [pendingInstructions, setPendingInstructions] = useState("");

  async function submit(instructions: string, allowClarification: boolean) {
    if (!instructions.trim()) return;
    setLoading(true);
    try {
      const result = await regenerateSection<T>({
        section,
        section_index: sectionIndex,
        destination: plan.destination,
        days: plan.days,
        budget: plan.budget,
        travelers: plan.travelers,
        traveler_type: plan.traveler_type,
        travel_start_date: plan.travel_start_date,
        user_instructions: instructions,
        current_plan: plan,
        allow_clarification: allowClarification,
      });
      if (result.clarification) {
        setClarification(result.clarification);
        setPendingInstructions(instructions);
      } else if (result.data !== undefined) {
        onApply(result.data);
        reset();
        toast.success("Updated");
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't apply that edit right now.");
    } finally {
      setLoading(false);
    }
  }

  function handleClarificationSubmit(values: Record<string, string | number>) {
    const answer = Object.entries(values)
      .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
      .join(", ");
    void submit(`${pendingInstructions}. ${answer}`, false);
  }

  function reset() {
    setOpen(false);
    setPrompt("");
    setClarification(null);
    setPendingInstructions("");
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Edit this section"
        className="inline-flex items-center justify-center w-7 h-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors print:hidden"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
    );
  }

  return (
    <div className="w-full basis-full mt-3 rounded-xl border border-primary/20 bg-card p-4 print:hidden">
      {clarification ? (
        <ClarificationForm prompt={clarification} onSubmit={handleClarificationSubmit} disabled={loading} />
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit(prompt, true);
          }}
          className="space-y-3"
        >
          <Textarea
            autoFocus
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={placeholder ?? "What should change here?"}
            rows={2}
            disabled={loading}
          />
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" disabled={loading || !prompt.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={reset} disabled={loading}>
              <X className="w-4 h-4" />
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
