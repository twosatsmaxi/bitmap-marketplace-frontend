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

function drawSquares(
  ctx: CanvasRenderingContext2D,
  squares: WorkerSquare[],
  layoutWidth: number,
  usedHeight: number,
  canvasSize: number
) {
  ctx.fillStyle = "#0d1117";
  ctx.fillRect(0, 0, canvasSize, canvasSize);
  const draw = Math.max(layoutWidth, usedHeight);
  const gridSize = canvasSize / draw;
  const offsetY = (canvasSize - usedHeight * gridSize) / 2;
  const unitPadding = gridSize / 4;

  // HCL orange matching bitmap-render
  ctx.fillStyle = "rgb(203,120,37)";
  for (const sq of squares) {
    const px = sq.x * gridSize + unitPadding;
    const py = sq.y * gridSize + offsetY + unitPadding;
    const pw = sq.r * gridSize - unitPadding * 2;
    if (pw <= 0) continue;
    ctx.fillRect(px, py, pw, pw);
  }
}

export default function BitmapRenderer({
  height,
  canvasSize = 300,
  onStatus,
  onResult,
}: BitmapRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const offscreenTransferredRef = useRef(false);

  // Spawn worker once
  useEffect(() => {
    const worker = new Worker("/bitmap-worker.js");
    workerRef.current = worker;
    offscreenTransferredRef.current = false;

    worker.onmessage = (e: MessageEvent) => {
      if (e.data.type === "done") {
        const { squares, layoutWidth, usedHeight } = e.data;

        // If OffscreenCanvas was NOT used (Safari), draw on main thread
        if (!offscreenTransferredRef.current && canvasRef.current) {
          const ctx = canvasRef.current.getContext("2d");
          if (ctx) drawSquares(ctx, squares, layoutWidth, usedHeight, canvasSize);
        }

        onResult?.(squares, layoutWidth, usedHeight);
        onStatus("done");
      }
    };

    worker.onerror = () => onStatus("error");

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch + render when height changes
  useEffect(() => {
    const worker = workerRef.current;
    if (!worker) return;

    onStatus("loading");

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${RENDER_API}/api/block/${height}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buffer = await res.arrayBuffer();
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = canvasSize;
        canvas.height = canvasSize;

        const supportsOffscreen =
          typeof OffscreenCanvas !== "undefined" &&
          typeof canvas.transferControlToOffscreen === "function";

        if (supportsOffscreen && !offscreenTransferredRef.current) {
          offscreenTransferredRef.current = true;
          const offscreen = canvas.transferControlToOffscreen();
          worker.postMessage(
            { type: "layout", buffer, canvasSize, offscreenCanvas: offscreen },
            [buffer, offscreen]
          );
        } else {
          worker.postMessage({ type: "layout", buffer, canvasSize }, [buffer]);
        }
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
