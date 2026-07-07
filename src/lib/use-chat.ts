"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendChatMessage } from "./api-client";
import type { ChatMessage, ClarificationPrompt, ItineraryRedirectParams } from "./types";

export type DisplayMessage =
  | { kind: "user"; content: string }
  | { kind: "snippet"; html: string }
  | { kind: "clarification"; prompt: ClarificationPrompt }
  | { kind: "loading" }
  | { kind: "error"; message: string };

export function useChat() {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [display, setDisplay] = useState<DisplayMessage[]>([]);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function send(userText: string) {
    if (!userText.trim() || pending) return;
    setPending(true);
    setDisplay((d) => [...d, { kind: "user", content: userText }, { kind: "loading" }]);

    const nextHistory: ChatMessage[] = [...history, { role: "user", content: userText }];

    try {
      const res = await sendChatMessage(nextHistory);
      setHistory(res.messages.length ? res.messages : nextHistory);

      setDisplay((d) => {
        const withoutLoading = d.slice(0, -1);

        if (res.content_type === "clarification" && res.clarification) {
          return [...withoutLoading, { kind: "clarification", prompt: res.clarification }];
        }

        if (res.content_type === "itinerary_redirect") {
          try {
            const params = JSON.parse(res.reply) as ItineraryRedirectParams;
            const qs = new URLSearchParams({
              destination: params.destination,
              days: String(params.days),
              budget: String(params.budget),
              travelers: String(params.travelers),
              traveler_type: params.traveler_type,
              autostart: "true",
            });
            if (params.travel_start_date) qs.set("travel_start_date", params.travel_start_date);
            if (params.origin_city) qs.set("origin_city", params.origin_city);
            router.push(`/itinerary?${qs.toString()}`);
            return [
              ...withoutLoading,
              { kind: "snippet", html: `<p>Building your <strong>${params.destination}</strong> itinerary — taking you there now…</p>` },
            ];
          } catch {
            return [...withoutLoading, { kind: "error", message: "Got an itinerary response I couldn't parse." }];
          }
        }

        // "snippet" or "html" (html is effectively dead on the backend but handled defensively)
        return [...withoutLoading, { kind: "snippet", html: res.reply || "<p>No response.</p>" }];
      });
    } catch (err) {
      setDisplay((d) => [
        ...d.slice(0, -1),
        { kind: "error", message: err instanceof Error ? err.message : "Something went wrong talking to the backend." },
      ]);
    } finally {
      setPending(false);
    }
  }

  function submitClarification(values: Record<string, string | number>) {
    const text = Object.entries(values)
      .filter(([, v]) => v !== "" && v !== undefined)
      .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
      .join(", ");
    return send(text);
  }

  return { display, pending, send, submitClarification };
}
