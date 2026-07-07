import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex-1 flex items-center justify-center px-6">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold tracking-tight mb-6">
          <span className="text-foreground">Your City</span>{" "}
          <span className="shimmer-text">to</span>{" "}
          <span className="text-primary">Anywhere</span>
        </h1>
        <p className="text-muted-foreground mb-8">
          Scaffold check — fonts, dark theme, and signature effects wired up.
        </p>
        <Card className="p-6 pulse-glow card-hover inline-block">
          <Button>Plan a trip</Button>
        </Card>
      </div>
    </main>
  );
}
