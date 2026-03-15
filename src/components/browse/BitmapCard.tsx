"use client";

import { useState } from "react";
import Link from "next/link";
import type { Bitmap } from "@/lib/types";
import BitmapRenderer from "@/components/explore/BitmapRenderer";
import RarityBadge from "@/components/ui/RarityBadge";
import StatusPill from "@/components/ui/StatusPill";
import PriceDisplay from "@/components/ui/PriceDisplay";
import type { RenderStatus } from "@/components/explore/types";

export default function BitmapCard({ bitmap }: { bitmap: Bitmap }) {
  const [status, setStatus] = useState<RenderStatus>("loading");

  return (
    <Link
      href={`/bitmap/${bitmap.id}`}
      className="group home-panel flex flex-col overflow-hidden transition-all duration-200 hover:border-primary/40 hover:bg-primary/[0.02]"
    >
      <div className="relative aspect-square border-b border-[rgba(120,72,18,0.55)] bg-[#0d1117]">
        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          </div>
        )}
        <BitmapRenderer
          height={bitmap.blockNumber}
          canvasSize={300}
          onStatus={setStatus}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-50 pointer-events-none" />
        <div className="absolute top-3 left-3 flex gap-2">
          <StatusPill status={bitmap.listingStatus} />
        </div>
        <div className="absolute top-3 right-3">
          <RarityBadge rarity={bitmap.rarity} />
        </div>
      </div>

      <div className="flex flex-col gap-1 bg-black/45 p-4">
        <h3 className="font-mono text-lg font-bold uppercase tracking-[0.04em] text-primary">
          {bitmap.blockNumber}.bitmap
        </h3>
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 capitalize">
            {bitmap.bitmapType}
          </span>
          <PriceDisplay price={bitmap.price} size="sm" />
        </div>
      </div>
    </Link>
  );
}
