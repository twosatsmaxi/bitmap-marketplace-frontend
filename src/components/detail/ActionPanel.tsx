"use client";

import type { Bitmap } from "@/lib/types";
import PriceDisplay from "@/components/ui/PriceDisplay";
import StatusPill from "@/components/ui/StatusPill";
import RarityBadge from "@/components/ui/RarityBadge";
import { Wallet, Tag, ArrowRightLeft } from "lucide-react";

export default function ActionPanel({ bitmap }: { bitmap: Bitmap }) {
  return (
    <div className="panel-frame pixel-cut p-5 bg-surface/50">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="font-heading font-bold text-3xl md:text-4xl text-text-primary mb-2">
            {bitmap.blockNumber}.bitmap
          </h1>
          <div className="flex items-center gap-3">
            <StatusPill status={bitmap.listingStatus} />
            <RarityBadge rarity={bitmap.rarity} />
          </div>
        </div>
      </div>

      <div className="my-6 p-4 border border-border bg-bg pixel-cut flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-[0.16em] text-text-secondary block mb-1">
            Current Price
          </span>
          <PriceDisplay price={bitmap.price} size="lg" />
        </div>
        {bitmap.lastSalePrice && (
          <div className="text-right border-l border-border pl-4">
            <span className="text-[10px] uppercase tracking-[0.16em] text-text-secondary block mb-1">
              Last Sale
            </span>
            <PriceDisplay price={bitmap.lastSalePrice} size="md" className="text-text-secondary" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {bitmap.listingStatus === "listed" ? (
          <>
            <button className="w-full flex items-center justify-center gap-2 bg-primary text-bg hover:bg-primary/90 font-bold py-3 px-4 uppercase tracking-wide transition-colors pixel-cut">
              <Wallet className="w-4 h-4" />
              Buy Now
            </button>
            <button className="w-full flex items-center justify-center gap-2 bg-surface-2 border border-border hover:bg-surface-3 text-text-primary font-bold py-3 px-4 uppercase tracking-wide transition-colors pixel-cut">
              <Tag className="w-4 h-4" />
              Make Offer
            </button>
          </>
        ) : (
          <button className="w-full flex items-center justify-center gap-2 bg-surface-2 border border-border hover:bg-surface-3 text-text-primary font-bold py-3 px-4 uppercase tracking-wide transition-colors pixel-cut">
            <Tag className="w-4 h-4" />
            Make Offer
          </button>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
        <span className="text-xs text-text-secondary">Owned by <span className="font-mono text-primary">{bitmap.owner.slice(0, 6)}...{bitmap.owner.slice(-4)}</span></span>
        <button className="text-xs text-text-secondary hover:text-primary transition-colors flex items-center gap-1">
          <ArrowRightLeft className="w-3 h-3" /> View History
        </button>
      </div>
    </div>
  );
}
