"use client";

import { useState } from "react";
import type { Bitmap } from "@/lib/types";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Wallet, Tag, ArrowRightLeft, ListPlus, XCircle } from "lucide-react";
import { useWalletStore } from "@/stores/wallet-store";
import { useCancelListing } from "@/hooks/useCancelListing";
import ListingModal from "./ListingModal";
import BuyModal from "./BuyModal";

export default function ActionPanel({ bitmap }: { bitmap: Bitmap }) {
  const [listingModalOpen, setListingModalOpen] = useState(false);
  const [buyModalOpen, setBuyModalOpen] = useState(false);

  const profile = useWalletStore((s) => s.profile);
  const provider = useWalletStore((s) => s.provider);
  const { cancel: cancelListing, isLoading: isCancelling } = useCancelListing();

  // Check if the current user owns this bitmap
  const isOwner = profile?.wallets.some(
    (w) =>
      w.ordinalsAddress === bitmap.owner || w.paymentAddress === bitmap.owner,
  );

  // TODO: get seller pubkey from wallet — for now use empty string as placeholder
  // The actual pubkey comes from the wallet provider during connect
  const sellerPubkey = ""; // Will be populated from wallet in the modal

  return (
    <div className="br-card px-5 py-5">
      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        {isOwner ? (
          // Owner actions
          bitmap.listingStatus === "listed" ? (
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => {
                // TODO: get listing ID and cancel
                // cancelListing(listingId);
              }}
              disabled={isCancelling}
            >
              <XCircle className="w-4 h-4" />
              {isCancelling ? "Cancelling..." : "Cancel Listing"}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => setListingModalOpen(true)}
            >
              <ListPlus className="w-4 h-4" />
              List for Sale
            </Button>
          )
        ) : bitmap.listingStatus === "listed" ? (
          // Non-owner, listed — Buy + Offer
          <>
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => setBuyModalOpen(true)}
            >
              <Wallet className="w-4 h-4" />
              Buy Now
              {bitmap.price && (
                <span className="ml-1 opacity-70">
                  {(bitmap.price / 100_000_000).toFixed(4)} BTC
                </span>
              )}
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
          // Non-owner, not listed — Offer only
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

      {/* Listing Modal */}
      <ListingModal
        isOpen={listingModalOpen}
        onClose={() => setListingModalOpen(false)}
        inscriptionId={bitmap.inscriptionId}
        sellerPubkey={sellerPubkey}
        blockNumber={bitmap.blockNumber}
      />

      {/* Buy Modal */}
      <BuyModal
        isOpen={buyModalOpen}
        onClose={() => setBuyModalOpen(false)}
        listingId="" // TODO: populated from listing data
        blockNumber={bitmap.blockNumber}
        priceSats={bitmap.price ?? 0}
        sellerAddress={bitmap.owner}
      />
    </div>
  );
}
