import Link from "next/link";
import type { Bitmap } from "@/lib/types";
import BitmapCanvas from "@/components/bitmap-art/BitmapCanvas";
import RarityBadge from "@/components/ui/RarityBadge";
import StatusPill from "@/components/ui/StatusPill";
import PriceDisplay from "@/components/ui/PriceDisplay";
import { formatNumber } from "@/lib/utils";

export default function BitmapCard({ bitmap }: { bitmap: Bitmap }) {
  return (
    <Link 
      href={`/bitmap/${bitmap.id}`}
      className="group flex flex-col panel-frame pixel-cut overflow-hidden hover:border-primary transition-all duration-300 animate-fadeUp hover:-translate-y-1 hover:shadow-glow bg-surface"
    >
      <div className="relative aspect-square border-b border-border/50 bg-[#000000]">
        <BitmapCanvas
          blockNumber={bitmap.blockNumber}
          bitmapType={bitmap.bitmapType}
          className="w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-60 pointer-events-none" />
        <div className="absolute top-3 left-3 flex gap-2">
          <StatusPill status={bitmap.listingStatus} />
        </div>
        <div className="absolute top-3 right-3">
          <RarityBadge rarity={bitmap.rarity} />
        </div>
      </div>
      
      <div className="p-4 flex flex-col gap-3 bg-surface/80">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-heading font-bold text-lg text-text-primary group-hover:text-primary transition-colors tracking-tight">
              {formatNumber(bitmap.blockNumber)}
            </h3>
            <span className="text-[10px] text-text-secondary capitalize font-mono uppercase tracking-[0.2em]">
              {bitmap.bitmapType}
            </span>
          </div>
          <div className="text-right mt-1">
            <PriceDisplay price={bitmap.price} size="sm" />
          </div>
        </div>
      </div>
    </Link>
  );
}
