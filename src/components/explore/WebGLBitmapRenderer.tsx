"use client";

import { useEffect, useRef } from "react";
import type { RenderStatus, WorkerSquare, AnimationStyle } from "./types";
import { createProgram, setupInstancedQuads } from "./webgl-utils";
import { vertexShader, fragmentShader } from "./shaders";

const RENDER_API = "";
const MAX_INSTANCES = 8192;

// Normalized base color: RGB(203, 120, 37) / 255
const BASE_R = 203 / 255;
const BASE_G = 120 / 255;
const BASE_B = 37 / 255;

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

interface GLState {
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  vao: WebGLVertexArrayObject;
  instanceBuffer: WebGLBuffer;
  uniforms: Record<string, WebGLUniformLocation>;
}

function getUniforms(
  gl: WebGL2RenderingContext,
  program: WebGLProgram
): Record<string, WebGLUniformLocation> {
  const names = [
    "u_canvasSize",
    "u_layoutWidth",
    "u_usedHeight",
    "u_squareCount",
    "u_startTime",
    "u_currentTime",
    "u_mouse",
    "u_flickerIndex",
    "u_scale",
    "u_baseColor",
  ];
  const out: Record<string, WebGLUniformLocation> = {};
  for (const name of names) {
    const loc = gl.getUniformLocation(program, name);
    if (loc !== null) out[name] = loc;
  }
  return out;
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
  const glStateRef = useRef<GLState | null>(null);
  const prevDataRef = useRef<{
    squares: WorkerSquare[];
    layoutWidth: number;
    usedHeight: number;
  } | null>(null);

  // ── Mouse tracking ──
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

  // ── WebGL init + worker spawn ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvasSize;
    canvas.height = canvasSize;

    // Init WebGL2
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      premultipliedAlpha: false,
    });
    if (!gl) {
      console.error("WebGL2 not available");
      onStatus("error");
      return;
    }

    const program = createProgram(gl, vertexShader, fragmentShader);
    const { vao, instanceBuffer } = setupInstancedQuads(
      gl,
      program,
      MAX_INSTANCES
    );
    const uniforms = getUniforms(gl, program);

    gl.useProgram(program);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Set static uniforms
    gl.uniform3f(uniforms.u_baseColor, BASE_R, BASE_G, BASE_B);
    gl.uniform1f(uniforms.u_canvasSize, canvasSize);

    const state: GLState = { gl, program, vao, instanceBuffer, uniforms };
    glStateRef.current = state;

    // Worker
    const worker = new Worker("/bitmap-worker.js");
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent) => {
      if (e.data.type === "done") {
        const { squares, layoutWidth, usedHeight } = e.data;

        // Upload instance data
        const count = Math.min(squares.length, MAX_INSTANCES);
        const data = new Float32Array(count * 4);
        for (let i = 0; i < count; i++) {
          const sq = squares[i];
          const off = i * 4;
          data[off] = sq.x;
          data[off + 1] = sq.y;
          data[off + 2] = sq.r;
          data[off + 3] = i; // use loop index as instance index
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);

        // Set layout uniforms
        gl.useProgram(program);
        gl.uniform1f(uniforms.u_layoutWidth, layoutWidth);
        gl.uniform1f(uniforms.u_usedHeight, usedHeight);
        gl.uniform1f(uniforms.u_squareCount, count);
        gl.uniform1f(uniforms.u_scale, 1.0);

        // Start animation loop
        const start = performance.now();
        const run = (now: number) => {
          gl.uniform1f(uniforms.u_startTime, start);
          gl.uniform1f(uniforms.u_currentTime, now);

          // Flicker: ~1% chance per frame
          const flickerIdx =
            Math.random() < 0.01
              ? Math.floor(Math.random() * count)
              : -1;
          gl.uniform1f(uniforms.u_flickerIndex, flickerIdx);

          // Mouse
          const m = mousePosRef.current;
          gl.uniform2f(uniforms.u_mouse, m ? m.x : -1, m ? m.y : -1);

          // Clear and draw
          gl.viewport(0, 0, canvasSize, canvasSize);
          gl.clearColor(BG_R, BG_G, BG_B, 1.0);
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.bindVertexArray(vao);
          gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, count);

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
      gl.deleteProgram(program);
      gl.deleteVertexArray(vao);
      gl.deleteBuffer(instanceBuffer);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      glStateRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animationStyle, canvasSize]);

  // ── Fetch + layout when height changes ──
  useEffect(() => {
    const worker = workerRef.current;
    const state = glStateRef.current;
    if (!worker || !state) return;

    onStatus("loading");

    let cancelled = false;

    (async () => {
      // Implode previous if exists
      if (prevDataRef.current && state) {
        const { gl, program, vao, uniforms } = state;
        const prev = prevDataRef.current;
        const count = Math.min(prev.squares.length, MAX_INSTANCES);

        // Re-upload previous data
        const data = new Float32Array(count * 4);
        for (let i = 0; i < count; i++) {
          const sq = prev.squares[i];
          const off = i * 4;
          data[off] = sq.x;
          data[off + 1] = sq.y;
          data[off + 2] = sq.r;
          data[off + 3] = i;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, state.instanceBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);

        gl.useProgram(program);
        gl.uniform1f(uniforms.u_layoutWidth, prev.layoutWidth);
        gl.uniform1f(uniforms.u_usedHeight, prev.usedHeight);
        gl.uniform1f(uniforms.u_squareCount, count);

        // Render implode at progress=1 (fully arrived), scale shrinking
        const outStart = performance.now();
        const outDuration = 300;

        await new Promise<void>((resolve) => {
          const animateOut = (now: number) => {
            const elapsed = now - outStart;
            const progress = Math.min(1, elapsed / outDuration);

            // Set time so all squares are at final position (progress=1)
            gl.uniform1f(uniforms.u_startTime, 0);
            gl.uniform1f(uniforms.u_currentTime, 4000); // well past 3s
            gl.uniform1f(uniforms.u_flickerIndex, -1);
            gl.uniform2f(uniforms.u_mouse, -1, -1);
            gl.uniform1f(uniforms.u_scale, 1 - progress);

            gl.viewport(0, 0, canvasSize, canvasSize);
            gl.clearColor(BG_R, BG_G, BG_B, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.bindVertexArray(vao);
            gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, count);

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

        // Reset scale for new block reveal
        if (state) {
          state.gl.useProgram(state.program);
          state.gl.uniform1f(state.uniforms.u_scale, 1.0);
        }

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
