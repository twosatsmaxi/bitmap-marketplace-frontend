"use client";

import { useState, useCallback } from "react";
import WebGLBitmapRenderer from "@/components/explore/WebGLBitmapRenderer";
import BitmapRenderer from "@/components/explore/BitmapRenderer";
import type { RenderStatus } from "@/components/explore/types";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

const supportsWebGL2 =
  typeof document !== "undefined" &&
  !!document.createElement("canvas").getContext("webgl2");

interface DetailCanvasProps {
  blockNumber: number;
}

export default function DetailCanvas({ blockNumber }: DetailCanvasProps) {
  const [status, setStatus] = useState<RenderStatus>("idle");
  const [retryKey, setRetryKey] = useState(0);

  const handleRetry = useCallback(() => {
    setStatus("idle");
    setRetryKey((k) => k + 1);
  }, []);

  return (
    <div className="br-card p-2 md:p-3">
      <div className="relative aspect-square w-full rounded-lg bg-[#090c11] overflow-hidden">
        {/* Renderer with retry key to force remount */}
        <div
          key={retryKey}
          className={cn(
            "absolute inset-0 transition-opacity duration-500",
            status === "done" ? "opacity-100" : "opacity-0"
          )}
        >
          {supportsWebGL2 ? (
            <WebGLBitmapRenderer height={blockNumber} canvasSize={800} onStatus={setStatus} />
          ) : (
            <BitmapRenderer height={blockNumber} canvasSize={800} onStatus={setStatus} />
          )}
        </div>

        {/* Loading State */}
        {(status === "loading" || status === "idle") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#090c11]">
            <div className="h-16 w-16 animate-pulse bg-[rgba(247,147,26,0.08)]" />
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-600">
              Bitmapping…
            </span>
          </div>
        )}

        {/* Error State with Retry */}
        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="flex flex-col items-center gap-2 text-center px-4">
              <span className="font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] text-zinc-500">
                Failed to render bitmap
              </span>
              <span className="font-mono text-[9px] md:text-[10px] text-zinc-700">
                Block data may not be available yet
              </span>
            </div>
            <button
              onClick={handleRetry}
              className="br-btn flex items-center gap-2 px-4 py-2 text-xs"
              aria-label="Retry loading bitmap"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
