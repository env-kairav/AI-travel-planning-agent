import { notFound } from "next/navigation";
import { ApiError, getItinerary } from "@/lib/api-client";
import { ReadOnlySavedItinerary } from "@/components/itinerary/read-only-saved-itinerary";

/**
 * The guest's own saved trip, view-only, regardless of public/private status
 * — unlike /share/[token], GET /api/itineraries/{id} has no visibility gate
 * (that endpoint exists for the owner checking their own trips, the share
 * link is what gates on is_public for outside visitors). Never passes any
 * edit callback to ReadOnlySavedItinerary, same as the share page — past
 * trips aren't editable from here or anywhere else.
 */
export default async function SavedTripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let saved;
  try {
    saved = await getItinerary(id);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 503)) {
      notFound();
    }
    throw err;
  }

  return <ReadOnlySavedItinerary saved={saved} />;
}
