# AI Travel Itinerary Agent — Frontend

Next.js (App Router) frontend for the [AI-travel-planning-agent-be](../AI-travel-planning-agent-be)
FastAPI backend — a chat-driven interface for planning trips, with a rich interactive
itinerary view (map, day-by-day timeline, budget breakdown, packing checklist).

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui, dark-only theme ported from the backend's own design tokens |
| Animation | Framer Motion |
| Map | react-leaflet |
| Data fetching | TanStack Query |
| Forms | react-hook-form + zod |

## Setup

```bash
npm install
cp .env.example .env.local   # point NEXT_PUBLIC_API_BASE_URL at your running backend
npm run dev
```

The backend must be running separately — see `AI-travel-planning-agent-be/README.md`
(`uvicorn main:app`, defaults to `http://localhost:8000`).

## Known backend caveat

Save/share itinerary endpoints (`/api/itineraries`, `/api/share/{token}`) will error
until `migration.sql` has been applied to the backend's Supabase project — this is a
backend-side gap, not a frontend bug (the save/share UI is built regardless).
