# AI Travel Itinerary Agent — Frontend

Next.js (App Router) frontend for the [AI-travel-planning-agent-be](../AI-travel-planning-agent-be)
FastAPI backend — a chat-driven interface for planning trips, with a rich interactive
itinerary view (map, day-by-day timeline, budget breakdown, packing checklist).

## Stack
| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui (built on `@base-ui/react`), dark-only theme ported from the backend's own design tokens |
| Animation | Framer Motion |
| Map | MapLibre GL JS + OpenFreeMap (free, keyless, 3D) |
| Data fetching | TanStack Query |
| Forms | Hand-rolled — a custom `<Calendar>`/`<DatePicker>` (dd/mm/yyyy, no native-input locale issues) plus generic field components, no form library |

## Setup

```bash
npm install
cp .env.example .env.local   # point NEXT_PUBLIC_API_BASE_URL at your running backend
npm run dev
```

The backend must be running separately — see `AI-travel-planning-agent-be/README.md`
(`uvicorn main:app`, defaults to `http://localhost:8000`).

## Deploy

**[Vercel](https://vercel.com), free tier — zero config.** Next.js on Vercel needs nothing
beyond importing the repo:

1. Deploy the backend first (see `AI-travel-planning-agent-be/README.md`'s Deploy section —
   Render) and note its URL.
2. Vercel dashboard → **Add New** → **Project** → import this repo.
3. Set env vars in the Vercel project settings: `NEXT_PUBLIC_API_BASE_URL` = the deployed
   backend URL, `NEXT_PUBLIC_API_KEY` only if the backend's `API_KEY` is set.
4. Deploy. Then go back and set the backend's `ALLOWED_ORIGINS` to this Vercel URL.

No `next.config.ts` changes needed — this app doesn't use `next/image` with external domains,
so there's nothing to whitelist.

## Known backend caveat

Save/share itinerary endpoints (`/api/itineraries`, `/api/share/{token}`) need
`migration.sql` applied to the backend's Supabase project. As of the most recent update
to that file it adds a `trip_purpose` column on top of the earlier `user_id` one — if
you applied an older version, saved trips still work but the profile page's trip
count/list needs the newer migration re-run to show real data (it degrades to an
empty list rather than erroring, so this can look like "it's just broken" — it's this,
specifically).
