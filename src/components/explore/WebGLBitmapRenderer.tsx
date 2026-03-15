"use client";

import { useEffect, useRef } from "react";
import type { RenderStatus, WorkerSquare, AnimationStyle } from "./types";
import { acquireSharedGL, releaseSharedGL, type SharedGL } from "./webgl-context";

const RENDER_API = "";
const MAX_INSTANCES = 8192;

// Background color: #0d1117
const BG_R = 13 / 255;
const BG_G = 17 / 255;
const BG_B = 23 / 255;

interface WebGLBitmapRendererProps {
  height: number;
  canvasSize?: number;
  onStatus: (status: RenderStatus) => void;
  onResult?: (
    squares: WorkerSquare[],
    layoutWidth: number,
    usedHeight: number
  ) => void;
  animationStyle?: AnimationStyle;
}

/** Render one frame into the shared GL context, then copy to the 2D canvas. */
function renderFrame(
  shared: SharedGL,
  ctx2d: CanvasRenderingContext2D,
  canvasSize: number,
  squares: Float32Array,
  count: number,
  layoutWidth: number,
  usedHeight: number,
  startTime: number,
  now: number,
  flickerIndex: number,
  mouseX: number,
  mouseY: number,
  scale: number
) {
  const { gl, program, buffers, uniforms, canvas: offscreen } = shared;

  // Ensure offscreen matches size
  if (offscreen.width !== canvasSize || offscreen.height !== canvasSize) {
    offscreen.width = canvasSize;
    offscreen.height = canvasSize;
  }

  gl.useProgram(program);

  // Upload instance data
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.instanceBuffer);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, squares);

  // Set uniforms
  gl.uniform1f(uniforms.u_canvasSize, canvasSize);
  gl.uniform1f(uniforms.u_layoutWidth, layoutWidth);
  gl.uniform1f(uniforms.u_usedHeight, usedHeight);
  gl.uniform1f(uniforms.u_squareCount, count);
  gl.uniform1f(uniforms.u_startTime, startTime);
  gl.uniform1f(uniforms.u_currentTime, now);
  gl.uniform1f(uniforms.u_flickerIndex, flickerIndex);
  gl.uniform2f(uniforms.u_mouse, mouseX, mouseY);
  gl.uniform1f(uniforms.u_scale, scale);

  // Draw
  gl.viewport(0, 0, canvasSize, canvasSize);
  gl.clearColor(BG_R, BG_G, BG_B, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.bindVertexArray(buffers.vao);
  gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, count);

  // Copy to visible 2D canvas
  ctx2d.clearRect(0, 0, canvasSize, canvasSize);
  ctx2d.drawImage(offscreen, 0, 0);
}

export default function WebGLBitmapRenderer({
  height,
  canvasSize = 300,
  onStatus,
  onResult,
  animationStyle = "bitfeed",
}: WebGLBitmapRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const animationRef = useRef<number>(0);
  const mousePosRef = useRef<{ x: number; y: number } | null>(null);
  const sharedRef = useRef<SharedGL | null>(null);
  const ctx2dRef = useRef<CanvasRenderingContext2D | null>(null);
  const instanceDataRef = useRef<Float32Array | null>(null);
  const prevDataRef = useRef<{
    squares: WorkerSquare[];
    layoutWidth: number;
    usedHeight: number;
  } | null>(null);

  // Mouse tracking
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

  // Shared GL + worker init
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvasSize;
    canvas.height = canvasSize;

    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) {
      onStatus("error");
      return;
    }
    ctx2dRef.current = ctx2d;

    let shared: SharedGL;
    try {
      shared = acquireSharedGL(canvasSize);
    } catch {
      onStatus("error");
      return;
    }
    sharedRef.current = shared;

    // Worker
    const worker = new Worker("/bitmap-worker.js");
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent) => {
      if (e.data.type === "done") {
        const { squares, layoutWidth, usedHeight } = e.data;
        const count = Math.min(squares.length, MAX_INSTANCES);

        // Pack instance data
        const data = new Float32Array(count * 4);
        for (let i = 0; i < count; i++) {
          const sq = squares[i];
          const off = i * 4;
          data[off] = sq.x;
          data[off + 1] = sq.y;
          data[off + 2] = sq.r;
          data[off + 3] = i;
        }
        instanceDataRef.current = data;

        // Start animation loop
        const start = performance.now();
        const run = (now: number) => {
          if (!ctx2dRef.current || !sharedRef.current || !instanceDataRef.current) return;

          const flickerIdx =
            Math.random() < 0.01
              ? Math.floor(Math.random() * count)
              : -1;

          const m = mousePosRef.current;

          renderFrame(
            sharedRef.current,
            ctx2dRef.current,
            canvasSize,
            instanceDataRef.current,
            count,
            layoutWidth,
            usedHeight,
            start,
            now,
            flickerIdx,
            m ? m.x : -1,
            m ? m.y : -1,
            1.0
          );

          const elapsed = now - start;
          const progress = Math.min(1, elapsed / 3000);
          if (progress < 1 || mousePosRef.current) {
            animationRef.current = requestAnimationFrame(run);
          }
        };

        cancelAnimationFrame(animationRef.current);
        animationRef.current = requestAnimationFrame(run);

        prevDataRef.current = { squares, layoutWidth, usedHeight };
        onResult?.(squares, layoutWidth, usedHeight);
        onStatus("done");
      }
    };

    worker.onerror = () => onStatus("error");

    return () => {
      worker.terminate();
      workerRef.current = null;
      cancelAnimationFrame(animationRef.current);
      releaseSharedGL();
      sharedRef.current = null;
      ctx2dRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animationStyle, canvasSize]);

  // Fetch + layout when height changes
  useEffect(() => {
    const worker = workerRef.current;
    const shared = sharedRef.current;
    const ctx2d = ctx2dRef.current;
    if (!worker || !shared || !ctx2d) return;

    onStatus("loading");

    let cancelled = false;

    (async () => {
      // Implode previous if exists
      if (prevDataRef.current) {
        const prev = prevDataRef.current;
        const count = Math.min(prev.squares.length, MAX_INSTANCES);

        const data = new Float32Array(count * 4);
        for (let i = 0; i < count; i++) {
          const sq = prev.squares[i];
          const off = i * 4;
          data[off] = sq.x;
          data[off + 1] = sq.y;
          data[off + 2] = sq.r;
          data[off + 3] = i;
        }

        const outStart = performance.now();
        const outDuration = 300;

        await new Promise<void>((resolve) => {
          const animateOut = (now: number) => {
            const elapsed = now - outStart;
            const progress = Math.min(1, elapsed / outDuration);

            renderFrame(
              shared,
              ctx2d,
              canvasSize,
              data,
              count,
              prev.layoutWidth,
              prev.usedHeight,
              0,
              4000, // well past 3s so all squares at final position
              -1,
              -1,
              -1,
              1 - progress
            );

            if (progress < 1 && !cancelled) {
              requestAnimationFrame(animateOut);
            } else {
              resolve();
            }
          };
          requestAnimationFrame(animateOut);
        });
      }

      if (cancelled) return;

      try {
        const res = await fetch(`${RENDER_API}/api/explore/blocks/${height}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buffer = await res.arrayBuffer();
        if (cancelled) return;

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
