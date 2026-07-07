/**
 * The backend's LLM-generated icon names (tips[].icon, packing.weather_icon, etc.)
 * are frequently NOT real lucide-react exports — e.g. "lucide-beach",
 * "lucide-sunglasses", "lucide-hiking" all showed up in real captured responses
 * during development. Resolve defensively: strip any "lucide-" prefix, try
 * kebab-case -> PascalCase, and fall back to a safe default rather than crashing.
 */
import * as LucideIcons from "lucide-react";
import { Sparkles, type LucideIcon } from "lucide-react";

function toPascalCase(input: string): string {
  return input
    .replace(/^lucide-/, "")
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase())
    .join("");
}

const ICON_ALIASES: Record<string, string> = {
  beach: "Waves",
  hiking: "Mountain",
  sunglasses: "Glasses",
  music: "Music2",
};

export function resolveIcon(name: string | undefined | null): LucideIcon {
  if (!name) return Sparkles;
  const bare = name.replace(/^lucide-/, "").toLowerCase();
  const aliased = ICON_ALIASES[bare];
  const pascal = aliased ?? toPascalCase(name);
  const found = (LucideIcons as unknown as Record<string, LucideIcon>)[pascal];
  return found ?? Sparkles;
}
