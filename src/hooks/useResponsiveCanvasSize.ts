"use client";

import { useMediaQuery } from "./useMediaQuery";

interface CanvasSizeOptions {
  mobile?: number;
  tablet?: number;
  desktop?: number;
  large?: number;
}

// Returns stable canvas sizes based on breakpoints
// Prevents constant re-rendering from ResizeObserver
export function useStableCanvasSize(options: CanvasSizeOptions = {}): number {
  const {
    mobile = 400,    // 2 columns on mobile
    tablet = 500,    // 3 columns on tablet
    desktop = 600,   // 4 columns on desktop
    large = 800,     // detail page
  } = options;

  const isMobile = useMediaQuery("(max-width: 767px)");
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
  const isDesktop = useMediaQuery("(min-width: 1024px) and (max-width: 1279px)");

  if (isMobile) return mobile;
  if (isTablet) return tablet;
  if (isDesktop) return desktop;
  return large;
}

// Hook for detail page - larger canvas
export function useDetailCanvasSize(): number {
  return useStableCanvasSize({
    mobile: 600,
    tablet: 800,
    desktop: 1000,
    large: 1200,
  });
}
