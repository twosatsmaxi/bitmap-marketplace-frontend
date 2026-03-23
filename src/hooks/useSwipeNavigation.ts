"use client";

import { useRef, useEffect, useCallback } from "react";

interface SwipeCallbacks {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

const MIN_DISTANCE = 50; // px
const MAX_VERTICAL = 30; // px
const MIN_VELOCITY = 0.3; // px/ms

/**
 * Detects horizontal swipe gestures on a ref'd element.
 * Distinguishes from scroll by requiring low vertical displacement and high velocity.
 */
export function useSwipeNavigation({ onSwipeLeft, onSwipeRight }: SwipeCallbacks) {
  const ref = useRef<HTMLElement>(null);
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleSwipe = useCallback(
    (dx: number, dy: number, dt: number) => {
      if (Math.abs(dx) < MIN_DISTANCE) return;
      if (Math.abs(dy) > MAX_VERTICAL) return;
      const velocity = Math.abs(dx) / dt;
      if (velocity < MIN_VELOCITY) return;

      if (dx < 0) {
        onSwipeLeft?.();
      } else {
        onSwipeRight?.();
      }
    },
    [onSwipeLeft, onSwipeRight],
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      touchStart.current = { x: t.clientX, y: t.clientY, time: Date.now() };
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStart.current.x;
      const dy = t.clientY - touchStart.current.y;
      const dt = Date.now() - touchStart.current.time;
      touchStart.current = null;
      handleSwipe(dx, dy, dt);
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [handleSwipe]);

  return ref;
}
