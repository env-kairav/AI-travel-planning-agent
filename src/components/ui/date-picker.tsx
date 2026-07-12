"use client";

import { useState } from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "./calendar";

function formatDisplay(iso: string | null): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}`;
}

/**
 * Replaces native <input type="date"> — that input's displayed/typed format
 * is controlled entirely by the browser/OS locale (confirmed: no HTML
 * attribute can force dd/mm/yyyy there), which is exactly what looked wrong
 * in a screenshot showing "mm/dd/yyyy". This is a real button + popover
 * calendar instead, so the format is unconditionally dd/mm/yyyy and the
 * value is always explicit rather than half-typed/ambiguous.
 */
export function DatePicker({
  id,
  value,
  onChange,
}: {
  id?: string;
  value: string | null;
  onChange: (iso: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        id={id}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-full border border-input bg-transparent px-4 py-2.5 text-sm transition-colors outline-none",
          "hover:border-ring/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          !value && "text-muted-foreground",
        )}
      >
        {value ? formatDisplay(value) : "dd/mm/yyyy"}
        <CalendarDays className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner side="bottom" align="start" sideOffset={8} className="z-50">
          <PopoverPrimitive.Popup className="rounded-2xl border border-border bg-popover p-4 text-popover-foreground shadow-xl ring-1 ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <Calendar
              value={value}
              onChange={(iso) => {
                onChange(iso);
                setOpen(false);
              }}
            />
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
