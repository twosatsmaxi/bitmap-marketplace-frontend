"use client";

import { useState, useRef, useEffect } from "react";
import WebGLBitmapRenderer from "@/components/explore/WebGLBitmapRenderer";
import BitmapRenderer from "@/components/explore/BitmapRenderer";
import type { RenderStatus } from "@/components/explore/types";
import { cn } from "@/lib/utils";

const supportsWebGL2 =
  typeof document !== "undefined" &&
  !!document.createElement("canvas").getContext("webgl2");

export default function DetailCanvas({ blockNumber }: { blockNumber: number }) {
  const [status, setStatus] = useState<RenderStatus>("idle");

  // Canvas container ref for responsive sizing
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState(800);

  // Measure container and set canvas size
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      // Render at device pixel ratio for crisp visuals, cap at 1200 for performance
      const size = Math.min(Math.round(rect.width * dpr), 1200);
      setCanvasSize(Math.max(size, 300)); // Minimum 300px
    };

    // Initial size
    updateSize();

    // Observe resize
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  return (
    <div className="br-card p-2 md:p-3">
      <div 
        ref={canvasContainerRef}
        className="relative aspect-square w-full rounded-lg bg-[#090c11] overflow-hidden"
      >
        {/* Renderer */}
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-500",
            status === "done" ? "opacity-100" : "opacity-0"
          )}
        >
          {supportsWebGL2 ? (
            <WebGLBitmapRenderer height={blockNumber} canvasSize={canvasSize} onStatus={setStatus} />
          ) : (
            <BitmapRenderer height={blockNumber} canvasSize={canvasSize} onStatus={setStatus} />
          )}
        </div>

        {/* Loading */}
        {(status === "loading" || status === "idle") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="h-12 w-12 md:h-16 md:w-16 animate-pulse rounded bg-[rgba(247,147,26,0.08)]" />
            <span className="font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] text-zinc-600">
              {status === "idle" ? "Fetching block data…" : "Rendering bitmap…"}
            </span>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <span className="font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] text-zinc-600">
              Failed to render bitmap
            </span>
            <span className="font-mono text-[9px] md:text-[10px] text-zinc-700">
              Block data may not be available yet
            </span>
          </div>
        )}
      </div>

      <div className="mt-2 text-center">
        <span className="font-mono text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-zinc-600">
          Block <span className="text-[#f7a23b]">#{blockNumber.toLocaleString()}</span> · Real transaction layout
        </span>
      </div>
    </div>
  );
}
