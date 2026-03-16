"use client";

import { useState } from "react";
import Link from "next/link";
import type { Bitmap } from "@/lib/types";
import BitmapRenderer from "@/components/explore/BitmapRenderer";
import RarityBadge from "@/components/ui/RarityBadge";
import StatusPill from "@/components/ui/StatusPill";
import PriceDisplay from "@/components/ui/PriceDisplay";
import type { RenderStatus } from "@/components/explore/types";
import { useStableCanvasSize } from "@/hooks/useResponsiveCanvasSize";

interface BitmapCardProps {
  bitmap: Bitmap;
}

export default function BitmapCard({ bitmap }: BitmapCardProps) {
  const [status, setStatus] = useState<RenderStatus>("loading");

  // Use stable canvas size based on breakpoints (not ResizeObserver)
  const canvasSize = useStableCanvasSize({
    mobile: 400,    // 2 columns
    tablet: 500,    // 3 columns  
    desktop: 600,   // 4-5 columns
    large: 600,
  });

  return (
    <Link
      href={`/bitmap/${bitmap.id}`}
      className="group home-panel flex flex-col overflow-hidden transition-all duration-200 hover:border-primary/40 hover:bg-primary/[0.02] active:scale-[0.98]"
    >
      <div className="relative aspect-square border-b border-[rgba(120,72,18,0.55)] bg-[#0d1117]">
        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          </div>
        )}
        <BitmapRenderer
          height={bitmap.blockNumber}
          canvasSize={canvasSize}
          onStatus={setStatus}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-50 pointer-events-none" />
        <div className="absolute top-2 left-2 flex gap-1.5 md:top-3 md:left-3 md:gap-2">
          <StatusPill status={bitmap.listingStatus} />
        </div>
        <div className="absolute top-2 right-2 md:top-3 md:right-3">
          <RarityBadge rarity={bitmap.rarity} />
        </div>
      </div>

      <div className="flex flex-col gap-0.5 md:gap-1 bg-black/45 p-3 md:p-4">
        <h3 className="font-mono text-base md:text-lg font-bold uppercase tracking-[0.04em] text-primary">
          {bitmap.blockNumber}.bitmap
        </h3>
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] md:text-[10px] uppercase tracking-[0.18em] text-zinc-500 capitalize">
            {bitmap.bitmapType}
          </span>
          <PriceDisplay price={bitmap.price} size="sm" />
        </div>
      </div>
    </Link>
  );
}
