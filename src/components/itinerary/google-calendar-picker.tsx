"use client";

import { CalendarPlus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { dayTheme } from "@/lib/day-theme";
import type { ItineraryDay } from "@/lib/types";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatGCalDate(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

/**
 * Mirrors the backend's ICS generator (main.py export_calendar's parse_time)
 * exactly — same accepted formats ("7:30 AM", "14:00", "9 PM"), same 09:00
 * fallback for anything unparseable — so a day's Google Calendar event matches
 * what the .ics export would have produced for the same day.
 */
function parseActivityTime(timeStr: string, dayDate: Date): Date {
  const result = new Date(dayDate);
  const match = timeStr.trim().toUpperCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/);
  if (!match) {
    result.setHours(9, 0, 0, 0);
    return result;
  }
  let hour = parseInt(match[1], 10);
  const minute = match[2] ? parseInt(match[2], 10) : 0;
  if (match[3] === "PM" && hour !== 12) hour += 12;
  if (match[3] === "AM" && hour === 12) hour = 0;
  result.setHours(hour, minute, 0, 0);
  return result;
}

/** Day 1 = travel_start_date itself; flexible-dates trips (no start date) fall
 *  back to today, same as the backend's export_calendar. */
function dayCalendarDate(travelStartDate: string | null, dayNumber: number): Date {
  const base = travelStartDate ? new Date(`${travelStartDate}T00:00:00`) : new Date();
  base.setDate(base.getDate() + (dayNumber - 1));
  return base;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "");
}

function buildGoogleCalendarUrl(day: ItineraryDay, destination: string, travelStartDate: string | null): string | null {
  if (day.activities.length === 0) return null;
  const dayDate = dayCalendarDate(travelStartDate, day.number);
  const start = parseActivityTime(day.activities[0].time, dayDate);
  // +2h after the last activity's start — matches the per-activity event length
  // the .ics export uses, applied to the day's final slot.
  const end = new Date(parseActivityTime(day.activities[day.activities.length - 1].time, dayDate).getTime() + 2 * 60 * 60 * 1000);
  const details = day.activities
    .map((a) => `${a.time} — ${a.title}: ${stripHtml(a.description).slice(0, 150)}`)
    .join("\n");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${destination} — Day ${day.number}: ${day.title}`,
    dates: `${formatGCalDate(start)}/${formatGCalDate(end)}`,
    details,
    location: destination,
    ctz: "Asia/Kolkata",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Opens Google Calendar directly, pre-filled — no file, no download. One event
 * per day (bundling that day's activities into the description) rather than
 * one per activity: Google's quick-add URL only supports a single event per
 * link, and a typical 6-activity/day trip would mean 30+ separate links
 * otherwise. Apple/Outlook users aren't covered by this — there's no public
 * one-click quick-add URL for either, only the .ics import flow (still
 * available via the backend's /api/itinerary/calendar for anyone who needs it).
 */
export function GoogleCalendarPicker({
  days,
  destination,
  travelStartDate,
}: {
  days: ItineraryDay[];
  destination: string;
  travelStartDate: string | null;
}) {
  const [open, setOpen] = useState(false);
  if (days.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            size="icon"
            variant="secondary"
            className="h-12 w-12 rounded-full shadow-xl border border-border"
            title="Add to Google Calendar"
          >
            <CalendarPlus className="w-5 h-5" />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Google Calendar</DialogTitle>
          <DialogDescription>
            Opens directly in Google Calendar, pre-filled — one event per day, nothing to download.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto -mx-1 px-1">
          {days.map((day) => {
            const t = dayTheme(day.number);
            const url = buildGoogleCalendarUrl(day, destination, travelStartDate);
            if (!url) return null;
            return (
              <a
                key={day.number}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-muted transition-colors"
              >
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: `${t.hex}1a`, color: t.hex }}
                >
                  {day.number}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground text-sm truncate">{day.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {day.weekday} · {day.date}
                  </p>
                </div>
              </a>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
