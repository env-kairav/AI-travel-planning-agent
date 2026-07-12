"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChat } from "@/lib/use-chat";
import { ClarificationForm } from "./clarification-form";
import { SnippetCard } from "./snippet-card";

const SUGGESTIONS = [
  "5 days in Goa, budget ₹40,000, beach & nightlife",
  "Honeymoon trip to Bali from Mumbai, 7 days",
  "Weekend adventure trip to Manali",
  "Family trip to Jaipur, 4 days, heritage sites",
];

export function ChatPanel() {
  const { display, pending, send, submitClarification } = useChat();
  const [input, setInput] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Picking a destination card on /destinations used to jump straight to
  // /itinerary with hardcoded defaults (travelers=2, "Your City", flexible
  // dates) — silently skipping origin/dates/group-size instead of asking.
  // Routing it through the same chat message a typed request would produce
  // reuses the existing clarification flow instead of duplicating it, so a
  // destination pick asks for exactly what's actually missing, same as
  // typing "Plan a trip to Goa" would.
  const autoSent = useRef(false);
  useEffect(() => {
    const destination = searchParams.get("destination");
    if (!destination || autoSent.current) return;
    autoSent.current = true;
    void send(`Plan a trip to ${destination}`);
    router.replace("/", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input;
    setInput("");
    void send(text);
  }

  // Check if there's a clarification prompt in the display
  const hasClarification = display.some((msg) => msg.kind === "clarification");

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-4">
      <AnimatePresence initial={false}>
        {display.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {msg.kind === "user" && (
              <div className="flex justify-end">
                <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[80%] text-sm font-medium">
                  {msg.content}
                </div>
              </div>
            )}
            {msg.kind === "snippet" && <SnippetCard html={msg.html} />}
            {msg.kind === "clarification" && (
              <ClarificationForm prompt={msg.prompt} onSubmit={submitClarification} disabled={pending} />
            )}
            {msg.kind === "loading" && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm px-1">
                <Loader2 className="w-4 h-4 animate-spin" />
                Thinking…
              </div>
            )}
            {msg.kind === "error" && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
                {msg.message}
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {display.length === 0 && (
        <div className="flex flex-wrap gap-2 justify-center mb-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => void send(s)}
              className="text-xs text-muted-foreground bg-card border border-border rounded-full px-3 py-1.5 hover:border-primary/40 hover:text-foreground transition-colors card-hover"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {!hasClarification && (
        <form onSubmit={handleSubmit} className="flex gap-2 sticky bottom-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Where do you want to go?"
            disabled={pending}
            className="h-12 rounded-full px-5 bg-card border-border"
          />
          <Button type="submit" size="icon" disabled={pending || !input.trim()} className="h-12 w-12 rounded-full flex-shrink-0">
            <ArrowUp className="w-5 h-5" />
          </Button>
        </form>
      )}
    </div>
  );
}
