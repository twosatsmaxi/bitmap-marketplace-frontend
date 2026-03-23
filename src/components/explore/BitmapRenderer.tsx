"use client";

import { useEffect, useRef } from "react";
import type { RenderStatus, WorkerSquare, AnimationStyle } from "./types";
import { drawBitfeedVacuum } from "./renderFunctions";

const RENDER_API = "";

interface BitmapRendererProps {
  height: number;
  canvasSize?: number;
  onStatus: (status: RenderStatus) => void;
  onResult?: (squares: WorkerSquare[], layoutWidth: number, usedHeight: number) => void;
  animationStyle?: AnimationStyle;
  skipEntryAnimation?: boolean;
  maxDpr?: number;
  mobileMode?: boolean;
}

export default function BitmapRenderer({
  height,
  canvasSize = 300,
  onStatus,
  onResult,
  animationStyle = "bitfeed",
  skipEntryAnimation = false,
  maxDpr,
  mobileMode = false,
}: BitmapRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const animationRef = useRef<number>(0);
  const mousePosRef = useRef<{ x: number; y: number } | null>(null);
  const prevDataRef = useRef<{
    squares: WorkerSquare[];
    layoutWidth: number;
    usedHeight: number;
  } | null>(null);

  // DPR-scaled size for crisp rendering — capped on mobile to reduce GPU load
  const rawDpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const dpr = maxDpr ? Math.min(rawDpr, maxDpr) : rawDpr;
  const scaledSize = Math.round(canvasSize * dpr);

  // Handle Mouse/Touch Tracking
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getCanvasCoords = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    };

    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = getCanvasCoords(e.clientX, e.clientY);
    };

    const handleMouseLeave = () => {
      mousePosRef.current = null;
    };

    // Touch: activate repulsion after long-press (200ms stationary)
    let touchTimer: ReturnType<typeof setTimeout> | null = null;
    let touchActive = false;
    let touchStartPos = { x: 0, y: 0 };

    const handleTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      touchStartPos = { x: t.clientX, y: t.clientY };
      touchActive = false;
      touchTimer = setTimeout(() => {
        touchActive = true;
        mousePosRef.current = getCanvasCoords(t.clientX, t.clientY);
      }, 200);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      const dx = t.clientX - touchStartPos.x;
      const dy = t.clientY - touchStartPos.y;
      // Cancel long-press if finger moved too far (scrolling)
      if (!touchActive && Math.abs(dx) + Math.abs(dy) > 10 && touchTimer) {
        clearTimeout(touchTimer);
        touchTimer = null;
        return;
      }
      if (touchActive) {
        mousePosRef.current = getCanvasCoords(t.clientX, t.clientY);
      }
    };

    const handleTouchEnd = () => {
      if (touchTimer) clearTimeout(touchTimer);
      touchTimer = null;
      touchActive = false;
      mousePosRef.current = null;
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: true });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: true });
    canvas.addEventListener("touchcancel", handleTouchEnd, { passive: true });
    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
      canvas.removeEventListener("touchcancel", handleTouchEnd);
      if (touchTimer) clearTimeout(touchTimer);
    };
  }, []);

  // Spawn worker once
  useEffect(() => {
    const worker = new Worker("/bitmap-worker.js");
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent) => {
      if (e.data.type === "done") {
        const { squares, layoutWidth, usedHeight } = e.data;
        const currentData = { squares, layoutWidth, usedHeight };

        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext("2d");
          if (ctx) {
            if (skipEntryAnimation) {
              // Render final frame immediately — no 3s animation
              drawBitfeedVacuum(ctx, squares, layoutWidth, usedHeight, scaledSize, 1, 0, 4000, -1, null, mobileMode);
            } else {
              const start = performance.now();
              const run = (now: number) => {
                const elapsed = now - start;
                const totalDuration = 3000;
                const progress = Math.min(1, elapsed / totalDuration);

                // Occasional flicker (approx 1% chance per frame)
                const flickerIndex = Math.random() < 0.01 ? Math.floor(Math.random() * squares.length) : -1;

                drawBitfeedVacuum(ctx, squares, layoutWidth, usedHeight, scaledSize, progress, start, now, flickerIndex, mousePosRef.current, mobileMode);

                // Continue loop if mouse is over or animating
                if (progress < 1 || mousePosRef.current) {
                  animationRef.current = requestAnimationFrame(run);
                }
              };
              cancelAnimationFrame(animationRef.current);
              animationRef.current = requestAnimationFrame(run);
            }
          }
        }

        prevDataRef.current = currentData;
        onResult?.(squares, layoutWidth, usedHeight);
        onStatus("done");
      }
    };

    worker.onerror = () => onStatus("error");

    return () => {
      worker.terminate();
      workerRef.current = null;
      cancelAnimationFrame(animationRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animationStyle]); // Re-run if style changes to restart loop if needed

  // Fetch + render when height changes
  useEffect(() => {
    const worker = workerRef.current;
    if (!worker) return;

    onStatus("loading");

    let cancelled = false;

    (async () => {
      // 1. Implode current if exists
      if (prevDataRef.current && canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
          const { squares, layoutWidth, usedHeight } = prevDataRef.current;
          const outStart = performance.now();
          const outDuration = 300;
          
          await new Promise<void>((resolve) => {
            const animateOut = (now: number) => {
              const elapsed = now - outStart;
              const progress = Math.min(1, elapsed / outDuration);
              
              // Reverse gravity/implode: scale down to center
              ctx.save();
              ctx.translate(scaledSize / 2, scaledSize / 2);
              ctx.scale(1 - progress, 1 - progress);
              ctx.translate(-scaledSize / 2, -scaledSize / 2);

              drawBitfeedVacuum(ctx, squares, layoutWidth, usedHeight, scaledSize, 1, 0, 0, -1, null, mobileMode);
              
              ctx.restore();

              if (progress < 1 && !cancelled) {
                requestAnimationFrame(animateOut);
              } else {
                resolve();
              }
            };
            requestAnimationFrame(animateOut);
          });
        }
      }

      try {
        const res = await fetch(`${RENDER_API}/api/explore/blocks/${height}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buffer = await res.arrayBuffer();
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = scaledSize;
        canvas.height = scaledSize;

        // We disable OffscreenCanvas for the reveal animation to ensure main thread control
        worker.postMessage({ type: "layout", buffer, canvasSize: scaledSize }, [buffer]);
      } catch {
        if (!cancelled) onStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]);

  // Set canvas dimensions imperatively to avoid hydration mismatch
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = scaledSize;
    canvas.height = scaledSize;
  }, [scaledSize]);

  // Note: width/height attributes are not set on JSX to avoid hydration mismatch
  // Server renders without these attributes, client sets them after mount
  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%" }}
      className="block"
    />
  );
}
