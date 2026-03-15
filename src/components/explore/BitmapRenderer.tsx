"use client";

import { useEffect, useRef } from "react";
import type { RenderStatus, WorkerSquare } from "./types";

const RENDER_API = "";

interface BitmapRendererProps {
  height: number;
  canvasSize?: number;
  onStatus: (status: RenderStatus) => void;
  onResult?: (squares: WorkerSquare[], layoutWidth: number, usedHeight: number) => void;
}

function easeOutBack(x: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

function drawSquares(
  ctx: CanvasRenderingContext2D,
  squares: WorkerSquare[],
  layoutWidth: number,
  usedHeight: number,
  canvasSize: number,
  progress: number = 1,
  startTime: number = 0,
  currentTime: number = 0
) {
  ctx.fillStyle = "#0d1117";
  ctx.fillRect(0, 0, canvasSize, canvasSize);
  const draw = Math.max(layoutWidth, usedHeight);
  const gridSize = canvasSize / draw;
  const offsetY = (canvasSize - usedHeight * gridSize) / 2;
  const unitPadding = gridSize / 4;

  const duration = 600; // ms
  const totalStagger = 400; // ms stagger over all squares

  // HCL orange matching bitmap-render
  ctx.fillStyle = "rgb(203,120,37)";
  
  for (let i = 0; i < squares.length; i++) {
    const sq = squares[i];
    
    // Animation logic
    let currentProgress = 1;
    if (progress < 1) {
      const staggerDelay = (i / squares.length) * totalStagger;
      const elapsed = currentTime - startTime - staggerDelay;
      currentProgress = Math.max(0, Math.min(1, elapsed / duration));
    }

    if (currentProgress <= 0) continue;

    const easedProgress = easeOutBack(currentProgress);
    
    const px = sq.x * gridSize + unitPadding;
    // Fall from 20 units above
    const startY = sq.y - 20;
    const currentY = startY + (sq.y - startY) * easedProgress;
    
    const py = currentY * gridSize + offsetY + unitPadding;
    const pw = sq.r * gridSize - unitPadding * 2;
    
    if (pw <= 0) continue;
    
    // Fade in
    ctx.globalAlpha = currentProgress;
    ctx.fillRect(px, py, pw, pw);
  }
  ctx.globalAlpha = 1;
}

export default function BitmapRenderer({
  height,
  canvasSize = 300,
  onStatus,
  onResult,
}: BitmapRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const animationRef = useRef<number>(0);

  // Spawn worker once
  useEffect(() => {
    const worker = new Worker("/bitmap-worker.js");
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent) => {
      if (e.data.type === "done") {
        const { squares, layoutWidth, usedHeight } = e.data;

        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext("2d");
          if (ctx) {
            const start = performance.now();
            const run = (now: number) => {
              const elapsed = now - start;
              const totalDuration = 1000; // Total including stagger
              const progress = Math.min(1, elapsed / totalDuration);

              drawSquares(ctx, squares, layoutWidth, usedHeight, canvasSize, progress, start, now);

              if (progress < 1) {
                animationRef.current = requestAnimationFrame(run);
              }
            };
            cancelAnimationFrame(animationRef.current);
            animationRef.current = requestAnimationFrame(run);
          }
        }

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
  }, []);

  // Fetch + render when height changes
  useEffect(() => {
    const worker = workerRef.current;
    if (!worker) return;

    onStatus("loading");
    cancelAnimationFrame(animationRef.current);

    let cancelled = false;

    (async () => {
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
