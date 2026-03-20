"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  return (
    <Link
      href="/activity"
      className="absolute top-6 left-1/2 -translate-x-1/2 z-10
        flex items-center gap-2 px-4 py-2
        border border-primary/30 rounded-lg
        bg-black/50 backdrop-blur-sm
        font-mono text-xs uppercase tracking-[0.15em] text-primary
        transition-all duration-200
        hover:bg-primary/10 hover:border-primary/50
        pointer-events-auto"
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      Back to Activity
    </Link>
  );
}
