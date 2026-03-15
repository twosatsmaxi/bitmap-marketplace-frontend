"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import WebGLBitmapRenderer from "./WebGLBitmapRenderer";
import BitmapRenderer from "./BitmapRenderer";
import type { BlockMeta, RenderStatus } from "./types";
import StatusPill from "@/components/ui/StatusPill";
import PriceDisplay from "@/components/ui/PriceDisplay";
import type { ListingStatus } from "@/lib/types";

const supportsWebGL2 =
  typeof document !== "undefined" &&
  !!document.createElement("canvas").getContext("webgl2");

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
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const card = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - card.left;
    const mouseY = e.clientY - card.top;
    
    // Tilt limit: 8 degrees
    const rotateX = ((mouseY - card.height / 2) / (card.height / 2)) * -8;
    const rotateY = ((mouseX - card.width / 2) / (card.width / 2)) * 8;
    
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <Link
      href={`/bitmap/${height}.bitmap`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="br-card group flex flex-col overflow-hidden p-0 transition-all hover:border-[rgba(255,255,255,0.15)]"
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: "transform 0.1s ease-out, border-color 0.2s ease",
      }}
    >
      {/* Card head */}
      <div className="flex items-center justify-between px-3 py-2">
        <span className="font-mono text-xs font-bold text-[#f7a23b]">
          #{height.toLocaleString()}
        </span>
        {meta && (
          <span className="font-mono text-[10px] text-[rgba(255,255,255,0.78)]">
            {meta.tx_count.toLocaleString()} txs
          </span>
        )}
      </div>

      {/* Canvas area */}
      <div className="relative mx-2 aspect-square rounded-lg bg-[#090c11] overflow-hidden">
        {/* Renderer */}
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-500",
            status === "done" ? "opacity-100" : "opacity-0"
          )}
        >
          {supportsWebGL2 ? (
            <WebGLBitmapRenderer
              height={height}
              canvasSize={300}
              onStatus={setStatus}
            />
          ) : (
            <BitmapRenderer
              height={height}
              canvasSize={300}
              onStatus={setStatus}
            />
          )}
        </div>

        {/* Loading skeleton */}
        {status === "loading" && (
          <div className="absolute inset-0 flex animate-pulse flex-col items-center justify-center gap-2 rounded-lg bg-[#090c11]">
            <div className="h-1/2 w-1/2 animate-pulse bg-[rgba(247,147,26,0.06)]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">
              Painting…
            </span>
          </div>
        )}

        {/* Idle state */}
        {status === "idle" && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-[#090c11]">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-700">
              Fetching pixels…
            </span>
          </div>
        )}

        {/* Error state */}
        {status === "error" && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-[#090c11]">
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
      <div className="flex flex-col gap-1 px-3 py-2.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm font-bold text-primary">
            {height}.bitmap
          </span>
        </div>

        {meta && (
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-[rgba(255,255,255,0.5)]">
              {formatDate(meta.timestamp)}
            </span>
            <span className="font-mono text-[10px] text-[rgba(255,255,255,0.5)]">
              {formatSize(meta.size)}
            </span>
          </div>
        )}

        {price !== undefined && (
          <div className="mt-1 border-t border-[rgba(255,255,255,0.08)] pt-1">
            <PriceDisplay price={price} size="sm" />
          </div>
        )}
      </div>
    </Link>
  );
}
