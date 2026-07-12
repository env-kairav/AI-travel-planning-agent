import type { Metadata } from "next";
import { PitchContent } from "./pitch-content";

export const metadata: Metadata = {
  title: "TripNest — Pitch",
  description: "TripNest in eight slides: the problem, the solution, and what makes it different.",
};

export default function PitchPage() {
  return <PitchContent />;
}
