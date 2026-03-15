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
}

export default function BitmapRenderer({
  height,
  canvasSize = 300,
  onStatus,
  onResult,
  animationStyle = "bitfeed",
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

  // Handle Mouse Tracking
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      mousePosRef.current = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    };

    const handleMouseLeave = () => {
      mousePosRef.current = null;
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
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
            const start = performance.now();
            const run = (now: number) => {
              const elapsed = now - start;
              const totalDuration = 3000;
              const progress = Math.min(1, elapsed / totalDuration);
              
              // Occasional flicker (approx 1% chance per frame)
              const flickerIndex = Math.random() < 0.01 ? Math.floor(Math.random() * squares.length) : -1;

              drawBitfeedVacuum(ctx, squares, layoutWidth, usedHeight, canvasSize, progress, start, now, flickerIndex, mousePosRef.current);
              
              // Continue loop if mouse is over or animating
              if (progress < 1 || mousePosRef.current) {
                animationRef.current = requestAnimationFrame(run);
              }
            };
            cancelAnimationFrame(animationRef.current);
            animationRef.current = requestAnimationFrame(run);
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
              ctx.translate(canvasSize / 2, canvasSize / 2);
              ctx.scale(1 - progress, 1 - progress);
              ctx.translate(-canvasSize / 2, -canvasSize / 2);
              
              drawBitfeedVacuum(ctx, squares, layoutWidth, usedHeight, canvasSize, 1);
              
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

        canvas.width = canvasSize;
        canvas.height = canvasSize;

        // We disable OffscreenCanvas for the reveal animation to ensure main thread control
        worker.postMessage({ type: "layout", buffer, canvasSize }, [buffer]);
      } catch {
        if (!cancelled) onStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize}
      height={canvasSize}
      style={{ imageRendering: "pixelated", width: "100%", height: "100%" }}
      className="block"
    />
  );
}
