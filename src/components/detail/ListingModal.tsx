"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { useCreateListing } from "@/hooks/useCreateListing";
import { useFeeRate } from "@/hooks/useFeeRate";
import type { ListingStep } from "@/stores/transaction-store";

interface ListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  inscriptionId: string;
  sellerPubkey: string;
  blockNumber: number;
}

const LISTING_STEPS: { key: ListingStep; label: string }[] = [
  { key: "preparing", label: "Looking up inscription" },
  { key: "creating", label: "Building transaction" },
  { key: "signing_locking", label: "Sign locking transaction" },
  { key: "signing_sale", label: "Sign sale authorization" },
  { key: "submitting", label: "Submitting to marketplace" },
];

function StepIndicator({ currentStep }: { currentStep: ListingStep }) {
  const activeIndex = LISTING_STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="flex flex-col gap-2">
      {LISTING_STEPS.map((step, i) => {
        const isComplete = activeIndex > i;
        const isActive = activeIndex === i;
        const isPending = activeIndex < i;

        return (
          <div key={step.key} className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs",
                isComplete && "bg-green-500/20 text-green-400",
                isActive && "bg-primary/20 text-primary",
                isPending && "bg-zinc-800 text-zinc-600",
              )}
            >
              {isComplete ? (
                <Check className="h-3.5 w-3.5" />
              ) : isActive ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <span>{i + 1}</span>
              )}
            </div>
            <span
              className={cn(
                "font-mono text-xs",
                isComplete && "text-zinc-400",
                isActive && "text-zinc-200",
                isPending && "text-zinc-600",
              )}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function ListingModal({
  isOpen,
  onClose,
  inscriptionId,
  sellerPubkey,
  blockNumber,
}: ListingModalProps) {
  const [priceSats, setPriceSats] = useState("");
  const { createListing, step, error, isProcessing, reset } = useCreateListing();
  const { fastest, halfHour, hour } = useFeeRate();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPriceSats("");
      reset();
    }
  }, [isOpen, reset]);

  const priceBtc = priceSats
    ? (Number(priceSats) / 100_000_000).toFixed(8)
    : "0.00000000";

  const handleSubmit = () => {
    const sats = Number(priceSats);
    if (!sats || sats <= 0) return;

    createListing({
      inscriptionId,
      priceSats: sats,
      sellerPubkey,
    });
  };

  const isIdle = step === "idle";
  const isComplete = step === "complete";
  const isError = step === "error";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isProcessing ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative mx-4 w-full max-w-md rounded-xl border border-[rgba(120,72,18,0.55)] bg-[rgba(9,9,11,0.98)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(120,72,18,0.35)] px-5 py-4">
          <h2 className="font-mono text-sm font-bold uppercase tracking-[0.12em] text-primary">
            List for Sale
          </h2>
          {!isProcessing && (
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-[rgba(247,147,26,0.1)] hover:text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-5 py-5">
          {isIdle && (
            <>
              {/* Bitmap info */}
              <div className="mb-4 rounded-lg bg-zinc-900/50 px-4 py-3">
                <span className="font-mono text-xs text-zinc-500">Bitmap</span>
                <p className="font-mono text-sm font-bold text-zinc-200">
                  {blockNumber}.bitmap
                </p>
              </div>

              {/* Price input */}
              <div className="mb-4">
                <label className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-zinc-500">
                  Price (sats)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={priceSats}
                  onChange={(e) => setPriceSats(e.target.value)}
                  placeholder="10000"
                  className="w-full rounded-lg border border-[rgba(120,72,18,0.35)] bg-zinc-900/50 px-4 py-3 font-mono text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-700 focus:border-primary"
                  autoFocus
                />
                <p className="mt-1 font-mono text-xs text-zinc-600">
                  {priceBtc} BTC
                </p>
              </div>

              {/* Fee rates info */}
              {(fastest > 0) && (
                <div className="mb-5 flex gap-3">
                  {[
                    { label: "Fast", value: fastest },
                    { label: "Medium", value: halfHour },
                    { label: "Slow", value: hour },
                  ].map((f) => (
                    <div
                      key={f.label}
                      className="flex-1 rounded-lg bg-zinc-900/50 px-3 py-2 text-center"
                    >
                      <span className="block font-mono text-[10px] uppercase text-zinc-600">
                        {f.label}
                      </span>
                      <span className="font-mono text-xs text-zinc-400">
                        {f.value} sat/vB
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleSubmit}
                disabled={!priceSats || Number(priceSats) <= 0}
              >
                List for Sale
              </Button>
            </>
          )}

          {isProcessing && (
            <div className="py-4">
              <StepIndicator currentStep={step} />
              <p className="mt-4 text-center font-mono text-xs text-zinc-500">
                Please approve the transaction in your wallet
              </p>
            </div>
          )}

          {isComplete && (
            <div className="flex flex-col items-center py-4">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
                <Check className="h-6 w-6 text-green-400" />
              </div>
              <p className="font-mono text-sm font-bold text-zinc-200">
                Listed successfully!
              </p>
              <p className="mt-1 font-mono text-xs text-zinc-500">
                {blockNumber}.bitmap is now available for purchase
              </p>
              <Button
                variant="primary"
                size="lg"
                className="mt-4 w-full"
                onClick={onClose}
              >
                Done
              </Button>
            </div>
          )}

          {isError && (
            <div className="flex flex-col items-center py-4">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
                <AlertCircle className="h-6 w-6 text-red-400" />
              </div>
              <p className="font-mono text-sm font-bold text-zinc-200">
                Listing failed
              </p>
              <p className="mt-1 text-center font-mono text-xs text-red-400">
                {error}
              </p>
              <div className="mt-4 flex w-full gap-2">
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={() => {
                    reset();
                  }}
                >
                  Try Again
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  className="flex-1"
                  onClick={onClose}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
