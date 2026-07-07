import { Suspense } from "react";
import { ItineraryContent } from "./itinerary-content";
import { ItineraryLoadingState } from "@/components/itinerary/loading-state";

export default function ItineraryPage() {
  return (
    <Suspense fallback={<ItineraryLoadingState destination="your trip" />}>
      <ItineraryContent />
    </Suspense>
  );
}
