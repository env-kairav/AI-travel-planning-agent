"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import type { ClarificationPrompt } from "@/lib/types";

// Options like "romantic_getaway"/"own_vehicle" are the literal values sent to
// the backend — display-only formatting to Title Case with spaces, the actual
// submitted value stays untouched.
function formatOptionLabel(opt: string): string {
  return opt.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Whether a field's current value violates its own min/max — used both to
// show an inline error and to block submit, instead of the old approach of
// silently rejecting/reverting each keystroke that produced an intermediate
// value below min (confirmed live: that made typing "5000" into a min:500
// field character-by-character get stuck oscillating around 500, since "5"
// and "50" were rejected outright before the digits could add up).
function fieldError(field: ClarificationPrompt["fields"][number], value: string | number | undefined): string | null {
  if (field.type !== "number" || value === undefined || value === "") return null;
  const num = Number(value);
  if (field.min != null && num < field.min) return `Must be at least ${field.min}`;
  if (field.max != null && num > field.max) return `Must be at most ${field.max}`;
  return null;
}

export function ClarificationForm({
  prompt,
  onSubmit,
  disabled,
}: {
  prompt: ClarificationPrompt;
  onSubmit: (values: Record<string, string | number>) => void;
  disabled?: boolean;
}) {
  const [values, setValues] = useState<Record<string, string | number>>({});

  const canSubmit = prompt.fields.every(
    (f) => values[f.id] !== undefined && values[f.id] !== "" && fieldError(f, values[f.id]) === null,
  );

  return (
    <Card className="p-5 border-primary/20">
      <p className="text-sm text-foreground mb-4">{prompt.message}</p>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(values);
        }}
      >
        {prompt.fields.map((field) => (
          <div key={field.id} className="space-y-1.5">
            <Label htmlFor={field.id}>{field.label}</Label>
            {field.type === "select" ? (
              <Select
                value={String(values[field.id] ?? "")}
                onValueChange={(v: string | null) => {
                  const fieldId = field.id;
                  setValues((prev) => ({ ...prev, [fieldId]: v ?? "" }));
                }}
              >
                <SelectTrigger id={field.id} className="w-full">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {(field.options ?? []).map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {formatOptionLabel(opt)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : field.type === "date" ? (
              <DatePicker
                id={field.id}
                value={typeof values[field.id] === "string" ? (values[field.id] as string) : null}
                onChange={(iso) => setValues((prev) => ({ ...prev, [field.id]: iso }))}
              />
            ) : (
              <Input
                id={field.id}
                type={field.type === "number" ? "number" : "text"}
                placeholder={field.placeholder ?? undefined}
                min={field.min ?? undefined}
                max={field.max ?? undefined}
                value={values[field.id] ?? ""}
                onChange={(e) => {
                  // Numbers are stored and validated after the fact (see
                  // fieldError) rather than rejected keystroke-by-keystroke —
                  // an out-of-range value is shown as an error, not silently
                  // reverted, so typing a multi-digit number never gets stuck
                  // on an intermediate value that happens to be below min.
                  const newValue: string | number = field.type === "number" && e.target.value !== ""
                    ? Number(e.target.value)
                    : e.target.value;
                  setValues((prev) => ({
                    ...prev,
                    [field.id]: newValue,
                  }));
                }}
              />
            )}
            {fieldError(field, values[field.id]) && (
              <p className="text-xs text-destructive">{fieldError(field, values[field.id])}</p>
            )}
            {field.id === "budget" && (
              <p className="text-xs text-muted-foreground">
                Rough estimate only — actual cost can vary based on your choices and any add-ons.
              </p>
            )}
          </div>
        ))}
        <Button type="submit" disabled={!canSubmit || disabled} className="w-full">
          Continue
        </Button>
      </form>
    </Card>
  );
}
