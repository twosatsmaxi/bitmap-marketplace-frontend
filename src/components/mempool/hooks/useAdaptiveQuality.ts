"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { QualityLevel } from "../types/mempool";

interface UseAdaptiveQualityReturn {
  quality: QualityLevel;
  fps: number;
  particleCount: number;
}

const QUALITY_SETTINGS: Record<QualityLevel, { maxParticles: number }> = {
  high: { maxParticles: 3000 },
  medium: { maxParticles: 1500 },
  low: { maxParticles: 500 },
};

export function useAdaptiveQuality(): UseAdaptiveQualityReturn {
  const [quality, setQuality] = useState<QualityLevel>("high");
  const [fps, setFps] = useState(60);
  const fpsRef = useRef<number[]>([]);
  const lastTimeRef = useRef(performance.now());
  const frameCountRef = useRef(0);

  const measureFps = useCallback(() => {
    const now = performance.now();
    frameCountRef.current++;

    if (now - lastTimeRef.current >= 1000) {
      const currentFps = frameCountRef.current;
      setFps(currentFps);

      fpsRef.current.push(currentFps);
      if (fpsRef.current.length > 5) {
        fpsRef.current.shift();
      }

      const avgFps =
        fpsRef.current.reduce((a, b) => a + b, 0) / fpsRef.current.length;

      // Adjust quality based on average FPS
      if (avgFps < 30 && quality !== "low") {
        setQuality("low");
      } else if (avgFps < 45 && quality === "high") {
        setQuality("medium");
      } else if (avgFps > 55 && quality === "low") {
        setQuality("medium");
      } else if (avgFps > 58 && quality === "medium") {
        setQuality("high");
      }

      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }

    requestAnimationFrame(measureFps);
  }, [quality]);

  useEffect(() => {
    const rafId = requestAnimationFrame(measureFps);
    return () => cancelAnimationFrame(rafId);
  }, [measureFps]);

  return {
    quality,
    fps,
    particleCount: QUALITY_SETTINGS[quality].maxParticles,
  };
}
