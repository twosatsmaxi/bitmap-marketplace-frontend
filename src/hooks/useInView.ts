"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface UseInViewOptions {
  /** Threshold of visibility to trigger (0-1) */
  threshold?: number;
  /** Margin around root for early triggering (e.g., "100px") */
  rootMargin?: string;
  /** Trigger once or every time element enters view */
  triggerOnce?: boolean;
}

interface UseInViewReturn {
  /** Ref to attach to target element */
  ref: (node: HTMLElement | null) => void;
  /** Whether element is currently in view */
  isInView: boolean;
  /** Whether element has ever been in view (for one-time animations) */
  hasBeenInView: boolean;
}

/**
 * Zero-dependency intersection observer hook for scroll-triggered animations.
 * Uses native Intersection Observer API.
 */
export function useInView(options: UseInViewOptions = {}): UseInViewReturn {
  const { threshold = 0.1, rootMargin = "100px", triggerOnce = true } = options;
  
  const [isInView, setIsInView] = useState(false);
  const [hasBeenInView, setHasBeenInView] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const setRef = useCallback((node: HTMLElement | null) => {
    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    elementRef.current = node;

    if (!node || typeof window === "undefined") return;

    // Don't observe if already triggered once and triggerOnce is true
    if (triggerOnce && hasBeenInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const inView = entry.isIntersecting;
          setIsInView(inView);
          
          if (inView) {
            setHasBeenInView(true);
            if (triggerOnce) {
              observer.disconnect();
              observerRef.current = null;
            }
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(node);
    observerRef.current = observer;
  }, [threshold, rootMargin, triggerOnce, hasBeenInView]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return { ref: setRef, isInView, hasBeenInView };
}
