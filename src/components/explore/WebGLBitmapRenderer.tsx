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
  enableRepulsion?: boolean;
  enableFlicker?: boolean;
  isometric?: boolean;
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
  scale: number,
  enableRepulsion = true,
  enableFlicker = true,
  isometric = false,
  tileHeightScale = 1.0
) {
  const { gl, canvas: offscreen } = shared;

  // Select flat or isometric program/buffers/uniforms
  const prog    = isometric ? shared.isoProgram  : shared.program;
  const bufs    = isometric ? shared.isoBuffers   : shared.buffers;
  const unis    = isometric ? shared.isoUniforms  : shared.uniforms;
  const vertCount = isometric ? 18 : 6;

  // Ensure offscreen matches size
  if (offscreen.width !== canvasSize || offscreen.height !== canvasSize) {
    offscreen.width = canvasSize;
    offscreen.height = canvasSize;
  }

  gl.useProgram(prog);

  // Upload instance data
  gl.bindBuffer(gl.ARRAY_BUFFER, bufs.instanceBuffer);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, squares);

  // Set uniforms
  gl.uniform1f(unis.u_canvasSize, canvasSize);
  gl.uniform1f(unis.u_layoutWidth, layoutWidth);
  gl.uniform1f(unis.u_usedHeight, usedHeight);
  gl.uniform1f(unis.u_squareCount, count);
  gl.uniform1f(unis.u_startTime, startTime);
  gl.uniform1f(unis.u_currentTime, now);
  gl.uniform1f(unis.u_flickerIndex, flickerIndex);
  gl.uniform2f(unis.u_mouse, mouseX, mouseY);
  gl.uniform1f(unis.u_scale, scale);
  gl.uniform1f(unis.u_enableRepulsion, enableRepulsion ? 1.0 : 0.0);
  gl.uniform1f(unis.u_enableFlicker, enableFlicker ? 1.0 : 0.0);
  if (isometric && unis.u_tileHeightScale != null) {
    gl.uniform1f(unis.u_tileHeightScale, tileHeightScale);
  }

  // Depth buffer: enable for isometric, disable for flat
  if (isometric) {
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
  } else {
    gl.disable(gl.DEPTH_TEST);
  }

  // Draw
  gl.viewport(0, 0, canvasSize, canvasSize);
  gl.clearColor(BG_R, BG_G, BG_B, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | (isometric ? gl.DEPTH_BUFFER_BIT : 0));
  gl.bindVertexArray(bufs.vao);
  gl.drawArraysInstanced(gl.TRIANGLES, 0, vertCount, count);

  // Copy to visible 2D canvas
  ctx2d.clearRect(0, 0, canvasSize, canvasSize);
  ctx2d.drawImage(offscreen, 0, 0);
}

/** Ease out quad for smooth transitions */
function easeOutQuad(t: number): number {
  return t * (2 - t);
}

export default function WebGLBitmapRenderer({
  height,
  canvasSize = 300,
  onStatus,
  onResult,
  animationStyle = "bitfeed",
  enableRepulsion = true,
  enableFlicker = true,
  isometric = false,
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
  const featuresRef = useRef({ enableRepulsion, enableFlicker, isometric });
  featuresRef.current = { enableRepulsion, enableFlicker, isometric };
  const loopActiveRef = useRef(false);
  const tileHeightScaleRef = useRef(isometric ? 1.0 : 0.0);
  const isometricTransitionRef = useRef<number | null>(null);

  // DPR-scaled size for crisp rendering on high-density displays
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const scaledSize = Math.round(canvasSize * dpr);

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

    // Restart render loop when mouse re-enters after it stopped
    const handleMouseEnter = () => {
      if (loopActiveRef.current) return;
      const prev = prevDataRef.current;
      const data = instanceDataRef.current;
      if (!prev || !data || !sharedRef.current || !ctx2dRef.current) return;

      const count = data.length / 4;
      loopActiveRef.current = true;

      const tick = (now: number) => {
        if (!ctx2dRef.current || !sharedRef.current || !instanceDataRef.current) {
          loopActiveRef.current = false;
          return;
        }
        const feat = featuresRef.current;
        const flickerIdx =
          feat.enableFlicker && Math.random() < 0.01
            ? Math.floor(Math.random() * count)
            : -1;
        const m = feat.enableRepulsion ? mousePosRef.current : null;

        renderFrame(
          sharedRef.current,
          ctx2dRef.current,
          scaledSize,
          instanceDataRef.current,
          count,
          prev.layoutWidth,
          prev.usedHeight,
          0,
          4000, // well past entry animation
          flickerIdx,
          m ? m.x : -1,
          m ? m.y : -1,
          1.0,
          feat.enableRepulsion,
          feat.enableFlicker,
          feat.isometric,
          tileHeightScaleRef.current
        );

        if (mousePosRef.current) {
          animationRef.current = requestAnimationFrame(tick);
        } else {
          loopActiveRef.current = false;
        }
      };

      cancelAnimationFrame(animationRef.current);
      animationRef.current = requestAnimationFrame(tick);
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    canvas.addEventListener("mouseenter", handleMouseEnter);
    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      canvas.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [scaledSize]);

  // Shared GL + worker init
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = scaledSize;
    canvas.height = scaledSize;

    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) {
      onStatus("error");
      return;
    }
    ctx2dRef.current = ctx2d;

    let shared: SharedGL;
    try {
      shared = acquireSharedGL(scaledSize);
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
        loopActiveRef.current = true;
        const run = (now: number) => {
          if (!ctx2dRef.current || !sharedRef.current || !instanceDataRef.current) {
            loopActiveRef.current = false;
            return;
          }

          const feat = featuresRef.current;
          const flickerIdx =
            feat.enableFlicker && Math.random() < 0.01
              ? Math.floor(Math.random() * count)
              : -1;

          const m = feat.enableRepulsion ? mousePosRef.current : null;

          renderFrame(
            sharedRef.current,
            ctx2dRef.current,
            scaledSize,
            instanceDataRef.current,
            count,
            layoutWidth,
            usedHeight,
            start,
            now,
            flickerIdx,
            m ? m.x : -1,
            m ? m.y : -1,
            1.0,
            feat.enableRepulsion,
            feat.enableFlicker,
            feat.isometric,
            tileHeightScaleRef.current
          );

          const elapsed = now - start;
          const progress = Math.min(1, elapsed / 3000);
          if (progress < 1 || mousePosRef.current) {
            animationRef.current = requestAnimationFrame(run);
          } else {
            loopActiveRef.current = false;
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
  }, [animationStyle, scaledSize]);

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
              scaledSize,
              data,
              count,
              prev.layoutWidth,
              prev.usedHeight,
              0,
              4000, // well past 3s so all squares at final position
              -1,
              -1,
              -1,
              1 - progress,
              undefined,
              undefined,
              featuresRef.current.isometric,
              tileHeightScaleRef.current
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

  // Animate tileHeightScale when isometric prop changes
  useEffect(() => {
    const target = isometric ? 1.0 : 0.0;
    const start = tileHeightScaleRef.current;
    if (Math.abs(target - start) < 0.001) return;

    const duration = 600; // ms
    const startTime = performance.now();

    // Cancel any existing transition
    if (isometricTransitionRef.current) {
      cancelAnimationFrame(isometricTransitionRef.current);
    }

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeOutQuad(progress);
      
      tileHeightScaleRef.current = start + (target - start) * eased;

      // Trigger a re-render if loop isn't active
      const prev = prevDataRef.current;
      const data = instanceDataRef.current;
      const shared = sharedRef.current;
      const ctx2d = ctx2dRef.current;
      
      if (prev && data && shared && ctx2d && !loopActiveRef.current) {
        const count = data.length / 4;
        renderFrame(
          shared,
          ctx2d,
          scaledSize,
          data,
          count,
          prev.layoutWidth,
          prev.usedHeight,
          0,
          4000,
          -1,
          -1,
          -1,
          1.0,
          featuresRef.current.enableRepulsion,
          featuresRef.current.enableFlicker,
          featuresRef.current.isometric,
          tileHeightScaleRef.current
        );
      }

      if (progress < 1) {
        isometricTransitionRef.current = requestAnimationFrame(animate);
      } else {
        isometricTransitionRef.current = null;
      }
    };

    isometricTransitionRef.current = requestAnimationFrame(animate);

    return () => {
      if (isometricTransitionRef.current) {
        cancelAnimationFrame(isometricTransitionRef.current);
        isometricTransitionRef.current = null;
      }
    };
  }, [isometric, scaledSize]);

  return (
    <canvas
      ref={canvasRef}
      width={scaledSize}
      height={scaledSize}
      style={{ width: "100%", height: "100%" }}
      className="block"
    />
  );
}
