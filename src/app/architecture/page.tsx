import type { Metadata } from "next";
import { ArchitectureContent } from "./architecture-content";

export const metadata: Metadata = {
  title: "How it works — TripNest",
  description: "A behind-the-scenes look at TripNest's frontend and backend architecture, including MCP.",
};

export default function ArchitecturePage() {
  return <ArchitectureContent />;
}
