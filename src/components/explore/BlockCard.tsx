"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import BitmapRenderer from "./BitmapRenderer";
import type { BlockMeta, RenderStatus } from "./types";
import StatusPill from "@/components/ui/StatusPill";
import PriceDisplay from "@/components/ui/PriceDisplay";
import type { ListingStatus } from "@/lib/types";

interface BlockCardProps {
  height: number;
  meta?: BlockMeta;
  listingStatus?: ListingStatus;
  price?: number;
}

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatSize(bytes: number) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export default function BlockCard({ height, meta, listingStatus, price }: BlockCardProps) {
  const [status, setStatus] = useState<RenderStatus>("idle");

  return (
    <Link
      href={`/bitmap/${height}.bitmap`}
      className="home-panel group flex flex-col overflow-hidden transition-all hover:border-primary/40"
    >
      {/* Canvas area */}
      <div className="relative aspect-square border-b border-[rgba(120,72,18,0.55)] bg-[#0d1117]">
        {/* Renderer — always mounted so it starts fetching */}
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-500",
            status === "done" ? "opacity-100" : "opacity-0"
          )}
        >
          <BitmapRenderer height={height} canvasSize={300} onStatus={setStatus} />
        </div>

        {/* Loading skeleton */}
        {status === "loading" && (
          <div className="absolute inset-0 flex animate-pulse flex-col items-center justify-center gap-2 bg-[#0d1117]">
            <div className="h-1/2 w-1/2 animate-pulse bg-[rgba(247,147,26,0.06)]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">
              Painting…
            </span>
          </div>
        )}

        {/* Idle state (initial) — shows while loading hasn't started */}
        {status === "idle" && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0d1117]">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-700">
              Fetching pixels…
            </span>
          </div>
        )}

        {/* Error state */}
        {status === "error" && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0d1117]">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">
              Bitmap not found
            </span>
          </div>
        )}

        {/* Listing pill overlay */}
        {listingStatus && listingStatus !== "unlisted" && (
          <div className="absolute left-2 top-2">
            <StatusPill status={listingStatus} />
          </div>
        )}
      </div>

      {/* Metadata row */}
      <div className="flex flex-col gap-1 p-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm font-bold text-primary">
            {height}.bitmap
          </span>
          {meta && (
            <span className="font-mono text-[10px] text-zinc-500">
              {meta.tx_count.toLocaleString()} txs
            </span>
          )}
        </div>

        {meta && (
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-zinc-600">
              {formatDate(meta.timestamp)}
            </span>
            <span className="font-mono text-[10px] text-zinc-600">
              {formatSize(meta.size)}
            </span>
          </div>
        )}

        {price !== undefined && (
          <div className="mt-1 border-t border-[rgba(120,72,18,0.3)] pt-1">
            <PriceDisplay price={price} size="sm" />
          </div>
        )}
      </div>
    </Link>
  );
}
