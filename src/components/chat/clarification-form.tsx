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

  const canSubmit = prompt.fields.every((f) => values[f.id] !== undefined && values[f.id] !== "");

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
                  let newValue: string | number = e.target.value;
                  if (field.type === "number") {
                    // Allow empty string for clearing the field
                    if (e.target.value === "") {
                      newValue = "";
                    } else {
                      const numValue = Number(e.target.value);
                      // Reject anything below the field's own minimum (days/travelers
                      // both come through as min:1 — 0 travelers/days is nonsensical
                      // and 0 travelers crashes the backend's per-person cost division)
                      // rather than special-casing "days" alone as before.
                      if (field.min != null && numValue < field.min) {
                        return;
                      }
                      newValue = numValue;
                    }
                  }
                  setValues((prev) => ({
                    ...prev,
                    [field.id]: newValue,
                  }));
                }}
              />
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
