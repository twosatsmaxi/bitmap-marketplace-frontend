"use client";

import type { Bitmap } from "@/lib/types";
import PriceDisplay from "@/components/ui/PriceDisplay";
import StatusPill from "@/components/ui/StatusPill";
import RarityBadge from "@/components/ui/RarityBadge";
import { Wallet, Tag, ArrowRightLeft } from "lucide-react";

export default function ActionPanel({ bitmap }: { bitmap: Bitmap }) {
  return (
    <div className="home-panel px-5 py-5">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="mb-2 font-mono text-3xl font-black uppercase tracking-[-0.03em] text-primary md:text-4xl">
            {bitmap.blockNumber}.bitmap
          </h1>
          <div className="flex items-center gap-3">
            <StatusPill status={bitmap.listingStatus} />
            <RarityBadge rarity={bitmap.rarity} />
          </div>
        </div>
      </div>

      <div className="my-6 flex items-center justify-between border border-[rgba(120,72,18,0.55)] bg-black/55 p-4">
        <div>
          <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
            Current Price
          </span>
          <PriceDisplay price={bitmap.price} size="lg" />
        </div>
        {bitmap.lastSalePrice && (
          <div className="border-l border-[rgba(120,72,18,0.55)] pl-4 text-right">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
              Last Sale
            </span>
            <PriceDisplay price={bitmap.lastSalePrice} size="md" className="text-text-secondary" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {bitmap.listingStatus === "listed" ? (
          <>
            <button className="flex w-full items-center justify-center gap-2 bg-primary px-4 py-3 font-mono text-sm font-bold uppercase tracking-[0.16em] text-black transition-colors hover:bg-[#ffae43]">
              <Wallet className="w-4 h-4" />
              Buy Now
            </button>
            <button className="flex w-full items-center justify-center gap-2 border border-[rgba(120,72,18,0.55)] bg-[rgba(10,10,12,0.92)] px-4 py-3 font-mono text-sm font-bold uppercase tracking-[0.16em] text-zinc-300 transition-colors hover:border-primary/45 hover:text-primary">
              <Tag className="w-4 h-4" />
              Make Offer
            </button>
          </>
        ) : (
          <button className="flex w-full items-center justify-center gap-2 border border-[rgba(120,72,18,0.55)] bg-[rgba(10,10,12,0.92)] px-4 py-3 font-mono text-sm font-bold uppercase tracking-[0.16em] text-zinc-300 transition-colors hover:border-primary/45 hover:text-primary">
            <Tag className="w-4 h-4" />
            Make Offer
          </button>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[rgba(120,72,18,0.55)] pt-4">
        <span className="text-xs text-zinc-500">Owned by <span className="font-mono text-primary">{bitmap.owner.slice(0, 6)}...{bitmap.owner.slice(-4)}</span></span>
        <button className="flex items-center gap-1 font-mono text-xs uppercase tracking-[0.14em] text-zinc-500 transition-colors hover:text-primary">
          <ArrowRightLeft className="w-3 h-3" /> View History
        </button>
      </div>
    </div>
  );
}
