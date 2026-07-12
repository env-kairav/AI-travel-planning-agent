"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toIso(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function parseIso(iso: string | null | undefined): { y: number; m: number; d: number } | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return { y, m: m - 1, d };
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * A month-grid calendar, entirely home-built (no date-picker dependency) so
 * the displayed/entered date format is unambiguously dd/mm/yyyy everywhere,
 * independent of the visitor's browser/OS locale — the thing a native
 * <input type="date"> can never guarantee. All date math works in local
 * year/month/day components only, never via toISOString() (that converts to
 * UTC and can silently shift the selected day by one).
 */
export function Calendar({
  value,
  onChange,
  minDate,
}: {
  value: string | null;
  onChange: (iso: string) => void;
  /** Dates before this are shown but not selectable. Defaults to today. */
  minDate?: Date;
}) {
  const selected = parseIso(value);
  const today = startOfDay(new Date());
  const floor = minDate ? startOfDay(minDate) : today;

  const [viewDate, setViewDate] = useState(() => {
    if (selected) return new Date(selected.y, selected.m, 1);
    return new Date(floor.getFullYear(), floor.getMonth(), 1);
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // getDay() is 0=Sunday..6=Saturday; shift so the grid starts on Monday.
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function goToMonth(delta: number) {
    setViewDate(new Date(year, month + delta, 1));
  }

  return (
    <div className="w-72 select-none">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => goToMonth(-1)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <p className="text-sm font-semibold text-foreground">
          {MONTH_LABELS[month]} {year}
        </p>
        <button
          type="button"
          onClick={() => goToMonth(1)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="text-center text-[11px] font-medium text-muted-foreground py-1">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`blank-${i}`} />;
          const cellDate = new Date(year, month, day);
          const isPast = cellDate < floor;
          const isToday = cellDate.getTime() === today.getTime();
          const isSelected = selected && selected.y === year && selected.m === month && selected.d === day;
          return (
            <button
              key={day}
              type="button"
              disabled={isPast}
              onClick={() => onChange(toIso(year, month, day))}
              className={cn(
                "h-9 rounded-lg text-sm font-medium transition-colors flex items-center justify-center",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : isPast
                    ? "text-muted-foreground/30 cursor-not-allowed"
                    : "text-foreground hover:bg-white/10",
                isToday && !isSelected && "ring-1 ring-primary/50",
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
