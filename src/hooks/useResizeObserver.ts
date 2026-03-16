"use client";

import { useState, useEffect, useRef, RefObject } from "react";

interface Size {
  width: number;
  height: number;
}

export function useResizeObserver<T extends HTMLElement>(): [RefObject<T>, Size] {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Initial size
    const rect = element.getBoundingClientRect();
    setSize({ width: rect.width, height: rect.height });

    // Create resize observer
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      }
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return [ref, size];
}

// Hook that returns canvas size based on container width
// Caps at max size for performance, accounts for DPR
export function useResponsiveCanvasSize(
  containerWidth: number,
  options: { maxSize?: number; minSize?: number } = {}
): number {
  const { maxSize = 600, minSize = 150 } = options;

  return useState(() => {
    if (typeof window === "undefined") return 300; // SSR fallback

    const dpr = window.devicePixelRatio || 1;
    // Render at 2x for crisp retina, but cap at maxSize
    const idealSize = Math.round(containerWidth * dpr);
    return Math.max(minSize, Math.min(idealSize, maxSize));
  })[0];
}
