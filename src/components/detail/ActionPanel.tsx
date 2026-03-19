"use client";

import type { Bitmap } from "@/lib/types";
import PriceDisplay from "@/components/ui/PriceDisplay";
import StatusPill from "@/components/ui/StatusPill";
import RarityBadge from "@/components/ui/RarityBadge";
import { Wallet, Tag, ArrowRightLeft } from "lucide-react";

export default function ActionPanel({ bitmap }: { bitmap: Bitmap }) {
  return (
    <div className="br-card px-5 py-5">


      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        {bitmap.listingStatus === "listed" ? (
          <>
            <button
              disabled
              className="br-btn flex w-full items-center justify-center gap-2 !bg-primary px-4 py-3 !text-black !border-transparent opacity-50 cursor-not-allowed"
              aria-label="Buy Now (coming soon)"
            >
              <Wallet className="w-4 h-4" />
              Buy Now
              <span className="rounded-sm bg-black/20 px-1.5 py-0.5 text-[9px] font-bold uppercase">Soon</span>
            </button>
            <button
              disabled
              className="br-btn flex w-full items-center justify-center gap-2 px-4 py-3 opacity-50 cursor-not-allowed"
              aria-label="Make Offer (coming soon)"
            >
              <Tag className="w-4 h-4" />
              Make Offer
              <span className="rounded-sm bg-[rgba(247,147,26,0.08)] px-1.5 py-0.5 text-[9px] text-primary">Soon</span>
            </button>
          </>
        ) : (
          <button
            disabled
            className="br-btn flex w-full items-center justify-center gap-2 px-4 py-3 opacity-50 cursor-not-allowed"
            aria-label="Make Offer (coming soon)"
          >
            <Tag className="w-4 h-4" />
            Make Offer
            <span className="rounded-sm bg-[rgba(247,147,26,0.08)] px-1.5 py-0.5 text-[9px] text-primary">Soon</span>
          </button>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-4 flex items-center justify-between border-t border-[rgba(255,255,255,0.08)] pt-4">
        <span className="text-xs text-zinc-500">
          Owned by{" "}
          <span className="font-mono text-primary">
            {bitmap.owner.slice(0, 6)}...{bitmap.owner.slice(-4)}
          </span>
        </span>
        <button
          disabled
          className="flex items-center gap-1 font-mono text-xs uppercase tracking-[0.14em] text-zinc-500 opacity-50 cursor-not-allowed"
          aria-label="View History (coming soon)"
        >
          <ArrowRightLeft className="w-3 h-3" /> View History
          <span className="rounded-sm bg-[rgba(247,147,26,0.08)] px-1.5 py-0.5 text-[9px] text-primary">Soon</span>
        </button>
      </div>
    </div>
  );
}
