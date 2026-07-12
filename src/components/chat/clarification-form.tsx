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
import type { ClarificationPrompt } from "@/lib/types";

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
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={field.id}
                type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                placeholder={field.type === "date" ? "dd/mm/yyyy" : (field.placeholder ?? undefined)}
                min={field.type === "number" && field.id === "days" ? "1" : (field.min ?? undefined)}
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
                      // Specific validation: "days" field should not allow 0
                      if (field.id === "days" && numValue === 0 && e.target.value !== "") {
                        return; // Don't update state if trying to enter 0
                      }
                      newValue = numValue;
                    }
                  } else if (field.type === "date" && e.target.value) {
                    // Keep date value as is
                    newValue = e.target.value;
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
