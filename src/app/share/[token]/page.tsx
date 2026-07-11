import { notFound } from "next/navigation";
import { ApiError, getSharedItinerary } from "@/lib/api-client";
import { ReadOnlySavedItinerary } from "@/components/itinerary/read-only-saved-itinerary";

export default async function SharedItineraryPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let saved;
  try {
    saved = await getSharedItinerary(token);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 403 || err.status === 503)) {
      notFound();
    }
    throw err;
  }

  return <ReadOnlySavedItinerary saved={saved} />;
}
