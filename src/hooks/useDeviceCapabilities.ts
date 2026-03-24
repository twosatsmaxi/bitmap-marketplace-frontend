"use client";

import { useMediaQuery, useIsMobile, useIsTablet } from "./useMediaQuery";
import type { QualityTier } from "@/components/explore/types";

export interface DeviceCapabilities {
  isMobile: boolean;
  isTablet: boolean;
  maxDpr: number;
  prefersReducedMotion: boolean;
  initialQualityTier: QualityTier;
  hasCoarsePointer: boolean;
}

const supportsWebGL2 =
  typeof document !== "undefined" &&
  !!document.createElement("canvas").getContext("webgl2");

export function useDeviceCapabilities(): DeviceCapabilities {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const hasCoarsePointer = useMediaQuery("(pointer: coarse)");

  const maxDpr = isMobile ? 2 : isTablet ? 2.5 : Infinity;

  let initialQualityTier: QualityTier;
  if (prefersReducedMotion) {
    initialQualityTier = "static";
  } else if (isMobile) {
    initialQualityTier = supportsWebGL2 ? "reduced" : "canvas2d";
  } else if (isTablet) {
    initialQualityTier = supportsWebGL2 ? "reduced" : "canvas2d";
  } else {
    initialQualityTier = supportsWebGL2 ? "full" : "canvas2d";
  }

  return {
    isMobile,
    isTablet,
    maxDpr,
    prefersReducedMotion,
    initialQualityTier,
    hasCoarsePointer,
  };
}
