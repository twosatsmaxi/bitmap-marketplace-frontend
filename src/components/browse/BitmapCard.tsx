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
      className="group flex flex-col bg-surface border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors animate-fadeUp"
    >
      <div className="relative aspect-square border-b border-border bg-[#050505]">
        <BitmapCanvas
          blockNumber={bitmap.blockNumber}
          bitmapType={bitmap.bitmapType}
          className="w-full h-full object-contain"
        />
        <div className="absolute top-2 left-2 flex gap-2">
          <StatusPill status={bitmap.listingStatus} />
        </div>
        <div className="absolute top-2 right-2">
          <RarityBadge rarity={bitmap.rarity} />
        </div>
      </div>
      
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-heading font-bold text-lg text-text-primary group-hover:text-primary transition-colors">
              {formatNumber(bitmap.blockNumber)}
            </h3>
            <span className="text-xs text-text-secondary capitalize">
              {bitmap.bitmapType}
            </span>
          </div>
          <div className="text-right">
            <PriceDisplay price={bitmap.price} size="sm" />
          </div>
        </div>
      </div>
    </Link>
  );
}
