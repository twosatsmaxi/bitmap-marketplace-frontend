"use client";

import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Spinner — rotating partial border ring                            */
/* ------------------------------------------------------------------ */

const SPINNER_SIZES = {
  sm: "h-4 w-4 border-[2px]",
  md: "h-6 w-6 border-[2px]",
  lg: "h-10 w-10 border-[3px]",
} as const;

export function Spinner({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block animate-spin rounded-full border-primary/30 border-t-primary",
        SPINNER_SIZES[size],
        className,
      )}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  ShimmerBar — gradient sweep bar (reuses globals.css shimmer)       */
/* ------------------------------------------------------------------ */

export function ShimmerBar({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "h-1 w-full bg-zinc-800/60 overflow-hidden",
        className,
      )}
    >
      <div className="h-full w-full animate-shimmer" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton — pulse placeholder block                                */
/* ------------------------------------------------------------------ */

export function Skeleton({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn("animate-pulse bg-zinc-800/60 rounded", className)}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PulseDots — three staggered dots                                  */
/* ------------------------------------------------------------------ */

export function PulseDots({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn("inline-flex items-center gap-1", className)}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 bg-primary rounded-full animate-pulse"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  );
}
