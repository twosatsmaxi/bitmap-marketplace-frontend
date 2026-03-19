"use client";

import { useEffect, useRef } from "react";

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

  // Reset trigger when loading completes
  useEffect(() => {
    if (!isLoading) {
      hasTriggered.current = false;
    }
  }, [isLoading]);

  if (!hasMore) return null;

  return (
    <div
      ref={ref}
      className="col-span-full flex items-center justify-center py-8"
    >
      {isLoading ? (
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <span className="font-mono text-xs text-zinc-500 uppercase tracking-wider">
            Loading more bitmaps...
          </span>
        </div>
      ) : (
        <div className="h-10" />
      )}
    </div>
  );
}
