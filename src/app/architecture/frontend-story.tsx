"use client";

import {
  Bot,
  Check,
  Cloud,
  Compass,
  DollarSign,
  ListChecks,
  Map,
  MessageCircle,
  Rocket,
  Save,
  Share2,
  Sparkles,
  SquareStack,
} from "lucide-react";
import { StorySection } from "./story-section";
import { FlowNode, FlowStack, FlowArrow, FlowRow } from "./flow-diagram";

export function FrontendStory() {
  return (
    <div>
      <StorySection step={1} accent={1} icon={MessageCircle} title="It starts with a conversation — or a browse">
        <p className="text-muted-foreground leading-relaxed">
          No forms to fill out first. You just type what you want — &ldquo;weekend trip to Manali&rdquo; is enough
          to start. The chat panel (<code className="text-xs bg-white/5 px-1.5 py-0.5 rounded">useChat</code>) sends
          your message straight to the backend and renders whatever comes back. Prefer to browse? Picking a
          destination card feeds that same chat pipeline (&ldquo;Plan a trip to Goa&rdquo;) instead of skipping
          straight to a page full of guessed defaults — same questions asked either way.
        </p>
        <div className="mt-6">
          <FlowNode icon={MessageCircle} label="Chat panel" sub="src/components/chat/chat-panel.tsx" tone="primary" />
        </div>
      </StorySection>

      <StorySection step={2} accent={2} icon={ListChecks} title="It fills in the gaps — one question at a time">
        <p className="text-muted-foreground leading-relaxed">
          The backend figures out what&apos;s still missing — origin city, dates, budget, adults/children
          separately, what you actually want to explore (free text, not a pick-one dropdown), who the trip is for,
          how you&apos;re traveling — and sends back a structured clarification prompt. The frontend renders it as a
          real form from one generic component, right down to a custom-built calendar (always dd/mm/yyyy — a native
          date input&apos;s display format is controlled by the browser/OS locale, not by us, so this is a real
          component, not a workaround).
        </p>
        <div className="mt-6">
          <FlowNode icon={Sparkles} label="Clarification form" sub="Adults, children, trip purpose, dates, transport…" />
        </div>
      </StorySection>

      <StorySection step={3} accent={3} icon={Rocket} title="Once everything's known, it redirects">
        <p className="text-muted-foreground leading-relaxed">
          The chat itself never builds the itinerary — that would mean generating the same trip twice. Instead it
          hands off a clean set of parameters and the app navigates to <code className="text-xs bg-white/5 px-1.5 py-0.5 rounded">/itinerary</code>,
          where the real generation begins.
        </p>
      </StorySection>

      <StorySection step={4} accent={4} icon={SquareStack} title="The trip builds itself, in view">
        <p className="text-muted-foreground leading-relaxed">
          A full itinerary takes 60–90 seconds to generate, so instead of a blank loading screen, the page polls a
          background job and renders each piece the moment it&apos;s ready — hero and tips first, then each day,
          one after another.
        </p>
        <div className="mt-6">
          <FlowStack>
            <FlowNode icon={Cloud} label="Job started" sub="POST /api/itinerary/plan/start" />
            <FlowArrow />
            <FlowNode icon={Bot} label="Polling for progress" sub="useItineraryGeneration" tone="primary" />
            <FlowArrow />
            <FlowNode icon={Check} label="Days stream in as they finish" />
          </FlowStack>
        </div>
      </StorySection>

      <StorySection step={5} accent={5} icon={Map} title="A map that actually shows the trip">
        <p className="text-muted-foreground leading-relaxed">
          Every activity with real coordinates becomes a numbered marker on a 3D MapLibre map (free, keyless
          OpenFreeMap tiles). Each day&apos;s stops are connected by a real routed line — driving distance and time
          included — with a subtle animated flow showing the direction of travel.
        </p>
      </StorySection>

      <StorySection step={6} accent={6} icon={DollarSign} title="Budget, tips, packing, sources — the full picture">
        <p className="text-muted-foreground leading-relaxed">
          Cost is broken down by category (and relabeled automatically if you picked train/bus/own vehicle instead
          of flying), tips are grounded with real weather, visa, and currency data, and every generated fact that
          came from a live source gets cited.
        </p>
        <div className="mt-6">
          <FlowRow>
            <FlowNode icon={DollarSign} label="Budget" />
            <FlowNode icon={Compass} label="Tips" />
            <FlowNode icon={ListChecks} label="Packing" />
          </FlowRow>
        </div>
      </StorySection>

      <StorySection step={7} accent={1} icon={Save} title="Save it, share it, take it with you">
        <p className="text-muted-foreground leading-relaxed">
          A finished trip can be saved (public or private) and reopened later from your profile — or shared as a
          read-only link anyone can open, no account required on either end. The whole trip can also be downloaded
          as one calendar file (every day, every activity), or quick-added a day at a time straight into Google
          Calendar.
        </p>
        <div className="mt-6">
          <FlowRow>
            <FlowNode icon={Save} label="Save to profile" />
            <FlowNode icon={Share2} label="Share a link" />
          </FlowRow>
        </div>
      </StorySection>
    </div>
  );
}
