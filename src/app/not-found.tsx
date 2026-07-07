import Link from "next/link";
import { Compass } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-24">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6 pulse-glow">
          <Compass className="w-6 h-6 text-primary" />
        </div>
        <h1 className="font-heading text-3xl font-bold text-foreground mb-3">Lost the trail</h1>
        <p className="text-muted-foreground mb-8">
          This page doesn&apos;t exist — maybe the trip you&apos;re looking for was never planned.
        </p>
        <Link href="/" className={buttonVariants({ variant: "default" })}>
          Plan a new trip
        </Link>
      </div>
    </main>
  );
}
