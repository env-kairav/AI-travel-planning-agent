"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-24">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-6 h-6 text-destructive" />
        </div>
        <h1 className="font-heading text-3xl font-bold text-foreground mb-3">Something went wrong</h1>
        <p className="text-muted-foreground mb-8">
          {error.message || "An unexpected error occurred while loading this page."}
        </p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}
