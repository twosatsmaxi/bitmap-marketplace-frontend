"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";

interface SwipeNavigatorProps {
  blockNumber: number;
  children: React.ReactNode;
}

/**
 * Wraps detail page content with horizontal swipe navigation.
 * Swipe left → next block, swipe right → previous block.
 */
export default function SwipeNavigator({ blockNumber, children }: SwipeNavigatorProps) {
  const router = useRouter();

  const onSwipeLeft = useCallback(() => {
    router.push(`/bitmap/${blockNumber + 1}.bitmap`);
  }, [router, blockNumber]);

  const onSwipeRight = useCallback(() => {
    if (blockNumber > 0) {
      router.push(`/bitmap/${blockNumber - 1}.bitmap`);
    }
  }, [router, blockNumber]);

  const ref = useSwipeNavigation({ onSwipeLeft, onSwipeRight });

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>}>
      {children}
    </div>
  );
}
