"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  return (
    <Link
      href="/activity"
      className="absolute bottom-6 left-4 md:left-6 z-10
        flex items-center gap-2 px-3 py-2
        border border-border bg-surface/90 backdrop-blur-sm
        font-mono text-[10px] uppercase tracking-[0.18em] text-text-secondary
        transition-all duration-200
        hover:border-primary/50 hover:text-primary hover:bg-primary/5
        pointer-events-auto"
      aria-label="Back to Activity"
    >
      <ArrowLeft className="w-3 h-3" />
      <span className="hidden sm:inline">Back to Activity</span>
    </Link>
  );
}
