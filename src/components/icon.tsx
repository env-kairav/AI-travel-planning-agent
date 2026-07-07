/**
 * Dynamic icon-by-name rendering (backend sends icon names as strings, often not
 * real lucide-react exports — see resolveIcon). Isolated to this one file so the
 * necessary lint exception is contained and explained in one place rather than
 * scattered across every call site.
 *
 * The React Compiler's static-components rule flags any
 * `const X = someFunction(); return <X />` as "component created during render" —
 * correct for genuinely defining a new component each render, but this is just
 * selecting an existing, already-declared icon component from a static map by
 * name, which is unavoidably dynamic (the name comes from runtime/LLM data, so it
 * cannot be "declared outside of render" as the rule suggests).
 */
/* eslint-disable react-hooks/static-components */
import { resolveIcon } from "@/lib/icon-resolver";

export function Icon({ name, className }: { name: string | undefined | null; className?: string }) {
  const Resolved = resolveIcon(name);
  return <Resolved className={className} />;
}
