"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface InfiniteScrollTriggerProps {
  onIntersect: () => void;
  hasMore: boolean;
  isLoading?: boolean;
  rootMargin?: string;
}

export default function InfiniteScrollTrigger({
  onIntersect,
  hasMore,
  isLoading = false,
  rootMargin = "200px",
}: InfiniteScrollTriggerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (!hasMore || isLoading) return;

    hasTriggered.current = false;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasTriggered.current) {
          hasTriggered.current = true;
          onIntersect();
        }
      },
      { rootMargin, threshold: 0 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [onIntersect, hasMore, isLoading, rootMargin]);

  if (!hasMore) return null;

  return (
    <div
      ref={ref}
      className="col-span-full flex items-center justify-center py-8 md:py-12"
    >
      {isLoading ? (
        <div className="flex flex-col items-center gap-4">
          {/* Pixel block loading animation */}
          <div className="flex items-end gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "w-3 h-3 border border-[rgba(247,147,26,0.4)]",
                  "animate-pulse"
                )}
                style={{
                  animationDelay: `${i * 150}ms`,
                  backgroundColor: `rgba(247,147,26,${0.15 + i * 0.15})`,
                }}
              />
            ))}
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            Loading blocks
          </span>
        </div>
      ) : (
        // Load More button - visible when not loading
        <button
          onClick={onIntersect}
          className={cn(
            "group flex items-center gap-2 px-4 py-2.5 rounded",
            "border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)]",
            "font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-400",
            "transition-all duration-200",
            "hover:border-[rgba(247,162,59,0.5)] hover:bg-[rgba(247,162,59,0.08)] hover:text-primary",
            "active:scale-95"
          )}
        >
          <span>Load More</span>
          <svg 
            className="w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
    </div>
  );
}
