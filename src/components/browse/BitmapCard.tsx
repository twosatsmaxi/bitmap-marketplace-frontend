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
      className="group home-panel flex flex-col overflow-hidden transition-all duration-200 hover:border-primary/40 hover:bg-primary/[0.02]"
    >
      <div className="relative aspect-square border-b border-[rgba(120,72,18,0.55)] bg-black">
        <BitmapCanvas
          blockNumber={bitmap.blockNumber}
          bitmapType={bitmap.bitmapType}
          className="w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-50 pointer-events-none" />
        <div className="absolute top-3 left-3 flex gap-2">
          <StatusPill status={bitmap.listingStatus} />
        </div>
        <div className="absolute top-3 right-3">
          <RarityBadge rarity={bitmap.rarity} />
        </div>
      </div>
      
      <div className="flex flex-col gap-3 bg-black/45 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-mono text-lg font-bold uppercase tracking-[0.04em] text-primary">
              {formatNumber(bitmap.blockNumber)}
            </h3>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 capitalize">
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
