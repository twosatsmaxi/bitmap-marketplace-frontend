"use client";

import { useState } from "react";
import type { Bitmap } from "@/lib/types";
import { Wallet, Tag, ListPlus, XCircle } from "lucide-react";
import { useWalletStore } from "@/stores/wallet-store";
import { useCancelListing } from "@/hooks/useCancelListing";
import ListingModal from "./ListingModal";

interface MobileActionBarProps {
  bitmap: Bitmap;
}

export default function MobileActionBar({ bitmap }: MobileActionBarProps) {
  const [listingModalOpen, setListingModalOpen] = useState(false);
  const [buyModalOpen, setBuyModalOpen] = useState(false);

  const profile = useWalletStore((s) => s.profile);
  const { cancel: cancelListing, isLoading: isCancelling } = useCancelListing();

  const isOwner = profile?.wallets.some(
    (w) =>
      w.ordinalsAddress === bitmap.owner || w.paymentAddress === bitmap.owner,
  );

  const sellerPubkey = "";

  const btnPrimary =
    "flex h-11 items-center gap-2 rounded-md border border-primary bg-primary px-4 font-mono text-xs font-bold uppercase tracking-[0.14em] text-black active:scale-95 transition-transform";
  const btnSecondary =
    "flex h-11 items-center gap-2 rounded-md border border-[rgba(120,72,18,0.55)] bg-[rgba(247,147,26,0.08)] px-4 font-mono text-xs font-bold uppercase tracking-[0.14em] text-primary opacity-50 cursor-not-allowed";

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[rgba(120,72,18,0.55)] bg-[rgba(7,7,9,0.98)] px-4 py-3 backdrop-blur-md safe-area-inset-bottom md:hidden">
        <div className="flex items-center gap-2">
          {isOwner ? (
            bitmap.listingStatus === "listed" ? (
              <button
                className={btnPrimary}
                onClick={() => {
                  // TODO: cancel with listing ID
                }}
                disabled={isCancelling}
              >
                <XCircle className="h-4 w-4" />
                {isCancelling ? "..." : "Cancel"}
              </button>
            ) : (
              <button
                className={btnPrimary}
                onClick={() => setListingModalOpen(true)}
              >
                <ListPlus className="h-4 w-4" />
                List
              </button>
            )
          ) : bitmap.listingStatus === "listed" ? (
            <>
              <button
                className={btnPrimary}
                onClick={() => setBuyModalOpen(true)}
              >
                <Wallet className="h-4 w-4" />
                Buy
              </button>
              <button disabled className={btnSecondary} aria-label="Offer (coming soon)">
                <Tag className="h-4 w-4" />
                Offer
              </button>
            </>
          ) : (
            <button disabled className={btnSecondary} aria-label="Make Offer (coming soon)">
              <Tag className="h-4 w-4" />
              Make Offer
            </button>
          )}
        </div>
      </div>

      {/* Listing Modal */}
      <ListingModal
        isOpen={listingModalOpen}
        onClose={() => setListingModalOpen(false)}
        inscriptionId={bitmap.inscriptionId}
        sellerPubkey={sellerPubkey}
        blockNumber={bitmap.blockNumber}
      />
    </>
  );
}
