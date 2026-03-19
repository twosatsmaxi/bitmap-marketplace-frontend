"use client";

import type { Bitmap } from "@/lib/types";
import PriceDisplay from "@/components/ui/PriceDisplay";
import { Wallet, Tag } from "lucide-react";

interface MobileActionBarProps {
  bitmap: Bitmap;
}

export default function MobileActionBar({ bitmap }: MobileActionBarProps) {


  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[rgba(120,72,18,0.55)] bg-[rgba(7,7,9,0.98)] px-4 py-3 backdrop-blur-md safe-area-inset-bottom md:hidden">
      <div className="flex items-center gap-4">
        {/* Price Info */}
        <div className="flex-1 min-w-0">
          <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
            {displayPrice !== undefined ? priceLabel : "Not listed"}
          </span>
          <PriceDisplay price={displayPrice} size="lg" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {bitmap.listingStatus === "listed" ? (
            <>
              <button
                disabled
                className="flex h-11 items-center gap-2 rounded-md border border-primary bg-primary px-4 font-mono text-xs font-bold uppercase tracking-[0.14em] text-black opacity-50 cursor-not-allowed"
                aria-label="Buy (coming soon)"
              >
                <Wallet className="h-4 w-4" />
                Buy
              </button>
              <button
                disabled
                className="flex h-11 items-center gap-2 rounded-md border border-[rgba(120,72,18,0.55)] bg-[rgba(247,147,26,0.08)] px-4 font-mono text-xs font-bold uppercase tracking-[0.14em] text-primary opacity-50 cursor-not-allowed"
                aria-label="Offer (coming soon)"
              >
                <Tag className="h-4 w-4" />
                Offer
              </button>
            </>
          ) : (
            <button
              disabled
              className="flex h-11 items-center gap-2 rounded-md border border-[rgba(120,72,18,0.55)] bg-[rgba(247,147,26,0.08)] px-4 font-mono text-xs font-bold uppercase tracking-[0.14em] text-primary opacity-50 cursor-not-allowed"
              aria-label="Make Offer (coming soon)"
            >
              <Tag className="h-4 w-4" />
              Make Offer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
