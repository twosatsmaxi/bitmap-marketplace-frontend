"use client";

import { useState } from "react";
import BitmapRenderer from "@/components/explore/BitmapRenderer";
import type { RenderStatus } from "@/components/explore/types";
import { cn } from "@/lib/utils";

export default function DetailCanvas({ blockNumber }: { blockNumber: number }) {
  const [status, setStatus] = useState<RenderStatus>("idle");

  return (
    <div className="br-card p-3">
      <div className="relative aspect-square w-full rounded-lg bg-[#090c11] overflow-hidden">
        {/* Renderer */}
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-500",
            status === "done" ? "opacity-100" : "opacity-0"
          )}
        >
          <BitmapRenderer height={blockNumber} canvasSize={800} onStatus={setStatus} />
        </div>

        {/* Loading */}
        {(status === "loading" || status === "idle") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="h-16 w-16 animate-pulse rounded bg-[rgba(247,147,26,0.08)]" />
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-600">
              {status === "idle" ? "Fetching block data…" : "Rendering bitmap…"}
            </span>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-600">
              Failed to render bitmap
            </span>
            <span className="font-mono text-[10px] text-zinc-700">
              Block data may not be available yet
            </span>
          </div>
        )}
      </div>

      <div className="mt-2 text-center">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">
          Block <span className="text-[#f7a23b]">#{blockNumber.toLocaleString()}</span> · Real transaction layout
        </span>
      </div>
    </div>
  );
}
