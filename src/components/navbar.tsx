import Link from "next/link";
import { Compass } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Compass className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-heading font-semibold text-lg text-foreground">TripNest</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/destinations" className="hover:text-foreground transition-colors">
            Destinations
          </Link>
          <Link href="/" className="hover:text-foreground transition-colors">
            Plan a trip
          </Link>
        </nav>
      </div>
    </header>
  );
}
