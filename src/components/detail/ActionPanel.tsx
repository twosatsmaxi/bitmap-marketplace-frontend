"use client";

import type { Bitmap } from "@/lib/types";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Wallet, Tag, ArrowRightLeft } from "lucide-react";

export default function ActionPanel({ bitmap }: { bitmap: Bitmap }) {
  return (
    <div className="br-card px-5 py-5">


      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        {bitmap.listingStatus === "listed" ? (
          <>
            <Button
              disabled
              variant="primary"
              size="lg"
              className="w-full"
              aria-label="Buy Now (coming soon)"
            >
              <Wallet className="w-4 h-4" />
              Buy Now
              <Badge variant="chip">Soon</Badge>
            </Button>
            <Button
              disabled
              size="lg"
              className="w-full"
              aria-label="Make Offer (coming soon)"
            >
              <Tag className="w-4 h-4" />
              Make Offer
              <Badge variant="soon">Soon</Badge>
            </Button>
          </>
        ) : (
          <Button
            disabled
            size="lg"
            className="w-full"
            aria-label="Make Offer (coming soon)"
          >
            <Tag className="w-4 h-4" />
            Make Offer
            <Badge variant="soon">Soon</Badge>
          </Button>
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
        <Button
          disabled
          variant="ghost"
          size="sm"
          className="border-none bg-transparent px-0 py-0"
          aria-label="View History (coming soon)"
        >
          <ArrowRightLeft className="w-3 h-3" /> View History
          <Badge variant="soon">Soon</Badge>
        </Button>
      </div>
    </div>
  );
}
