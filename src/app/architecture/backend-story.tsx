"use client";

import {
  Brain,
  CircleDollarSign,
  Cloud,
  Database,
  GitBranch,
  Globe,
  Layers,
  Plug,
  Server,
  Split,
  Stamp,
} from "lucide-react";
import { StorySection } from "./story-section";
import { FlowNode, FlowStack, FlowArrow, FlowRow } from "./flow-diagram";

export function BackendStory() {
  return (
    <div>
      <StorySection step={1} accent={2} icon={Server} title="One FastAPI app, two jobs">
        <p className="text-muted-foreground leading-relaxed">
          Every request lands on the same FastAPI app — <code className="text-xs bg-white/5 px-1.5 py-0.5 rounded">/chat</code> for
          the conversation, and a set of <code className="text-xs bg-white/5 px-1.5 py-0.5 rounded">/api/*</code> routes
          for everything else: generating itineraries, saving trips, checking weather, visas, flights.
        </p>
      </StorySection>

      <StorySection step={2} accent={3} icon={Brain} title="A system prompt that reasons before it answers">
        <p className="text-muted-foreground leading-relaxed">
          Before replying, the model works through a fixed checklist: is the destination known? Is there a real
          origin city <em>and</em> a real date — not just budget or group size? If either is missing, it asks;
          if everything&apos;s there, it hands off to generation instead of building the trip twice.
        </p>
        <div className="mt-6">
          <FlowNode icon={Split} label="Destination known?" sub="No → ask · Yes → keep going" />
        </div>
      </StorySection>

      <StorySection step={3} accent={4} icon={GitBranch} title="One model goes down, the next picks it up">
        <p className="text-muted-foreground leading-relaxed">
          LLM calls try three providers in order — whichever is configured and actually responds wins. No single
          provider outage takes the whole app down.
        </p>
        <div className="mt-6">
          <FlowRow>
            <FlowNode icon={Brain} label="OpenAI" sub="gpt-4o-mini" tone="primary" />
            <FlowNode icon={Brain} label="Gemini" sub="gemini-2.0-flash" />
            <FlowNode icon={Brain} label="Groq" sub="llama-3.3-70b" />
          </FlowRow>
        </div>
      </StorySection>

      <StorySection step={4} accent={1} icon={Split} title="A job that starts instantly and finishes in the background">
        <p className="text-muted-foreground leading-relaxed">
          Building a full itinerary takes too long for a single request to just sit and wait on — so the endpoint
          that kicks it off returns immediately with a job ID, while the actual generation runs as a background
          task and writes its progress to Supabase as it goes.
        </p>
        <div className="mt-6">
          <FlowNode icon={Split} label="POST /api/itinerary/plan/start" sub="Returns a job_id right away" />
        </div>
      </StorySection>

      <StorySection step={5} accent={5} icon={Layers} title="Generation happens in chunks, not one giant call">
        <p className="text-muted-foreground leading-relaxed">
          A 10-day trip isn&apos;t generated as one massive request — the trip structure (hero, tips, packing) comes
          first, then days are generated a few at a time. Each finished piece is written to a background job row in
          Supabase, which is exactly what the frontend is polling. The chunk boundaries themselves are chosen
          deliberately: a trailing single-day chunk is folded into the previous one, so the model is never handed a
          lone final day that reads as both &ldquo;first day of this batch&rdquo; and &ldquo;last day of this
          batch&rdquo; at once — that exact overlap used to make it invent a same-day arrival right before departure.
        </p>
        <div className="mt-6">
          <FlowStack>
            <FlowNode icon={Layers} label="Structure: hero, tips, packing" tone="primary" />
            <FlowArrow />
            <FlowNode icon={Layers} label="Days 1–3" />
            <FlowArrow />
            <FlowNode icon={Layers} label="Days 4–6…" />
          </FlowStack>
        </div>
      </StorySection>

      <StorySection step={6} accent={6} icon={Database} title="Grounded in real data, not just the model's memory">
        <p className="text-muted-foreground leading-relaxed">
          Hotels, restaurants, and attractions come from a Supabase-backed database of real ingested data. Anything
          it doesn&apos;t have gets filled in live — Wikipedia for destination context, Open-Meteo for weather,
          exchange rates and visa rules for international trips, and (when configured) live web search with cited
          sources for destinations with no curated data at all.
        </p>
        <div className="mt-6">
          <FlowRow>
            <FlowNode icon={Database} label="Supabase" sub="Hotels, restaurants, attractions" />
            <FlowNode icon={Globe} label="Wikipedia + web search" />
            <FlowNode icon={Cloud} label="Open-Meteo" sub="Weather" />
            <FlowNode icon={Stamp} label="Visa + exchange rate" />
          </FlowRow>
        </div>
      </StorySection>

      <StorySection step={7} accent={1} icon={CircleDollarSign} title="A budget that actually responds to your choices">
        <p className="text-muted-foreground leading-relaxed">
          Cost is computed per person, and the biggest lever is how you&apos;re getting there — choosing train, bus,
          or your own vehicle over flying can cut that single line item by up to 90%. Every other line item —
          hotel, food, activities, local transport — scales with the stated budget too, each with its own sane
          floor, instead of a fixed per-day rate that ignored what was actually asked for.
        </p>
      </StorySection>

      <StorySection step={8} accent={2} icon={Plug} title="MCP: the same tools, a different door">
        <p className="text-muted-foreground leading-relaxed">
          Everything the chat agent can do internally — generate an itinerary, check visa requirements, get a cost
          estimate, look up flights — is <em>also</em> exposed as a standalone MCP (Model Context Protocol) server,
          running as its own process. Any MCP-compatible client (Claude Desktop, an internal company tool, a
          WhatsApp bot) can call the exact same tools directly, without going through the chat UI at all. Same
          brain, a second entry point.
        </p>
        <div className="mt-6">
          <FlowStack>
            <FlowNode icon={Server} label="Chat agent" sub="calls tools internally, port 8000" />
            <FlowArrow />
            <FlowNode icon={Plug} label="MCP server" sub="same tools, port 8001, standalone process" tone="primary" />
            <FlowArrow />
            <FlowNode icon={Globe} label="Any MCP client" sub="Claude Desktop, internal tools, bots" />
          </FlowStack>
        </div>
      </StorySection>
    </div>
  );
}
