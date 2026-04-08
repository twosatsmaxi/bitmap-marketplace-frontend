"use client";

import { useEffect } from "react";
import { X, Loader2, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { useBuyListing } from "@/hooks/useBuyListing";
import { useFeeRate } from "@/hooks/useFeeRate";
import TransactionSuccess from "./TransactionSuccess";
import type { BuyingStep } from "@/stores/transaction-store";

interface BuyModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  blockNumber: number;
  priceSats: number;
  sellerAddress: string;
}

const BUY_STEPS: { key: BuyingStep; label: string }[] = [
  { key: "fetching_utxos", label: "Checking your balance" },
  { key: "initiating", label: "Building transaction" },
  { key: "signing", label: "Sign purchase transaction" },
  { key: "confirming", label: "Broadcasting transaction" },
];

function StepIndicator({ currentStep }: { currentStep: BuyingStep }) {
  const activeIndex = BUY_STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="flex flex-col gap-2">
      {BUY_STEPS.map((step, i) => {
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

export default function BuyModal({
  isOpen,
  onClose,
  listingId,
  blockNumber,
  priceSats,
  sellerAddress,
}: BuyModalProps) {
  const { buy, step, error, txId, isProcessing, reset } = useBuyListing();
  const { halfHour } = useFeeRate();

  useEffect(() => {
    if (isOpen) reset();
  }, [isOpen, reset]);

  const priceBtc = (priceSats / 100_000_000).toFixed(8);
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
            Buy Now
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
              {/* Listing summary */}
              <div className="mb-4 rounded-lg bg-zinc-900/50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs text-zinc-500">
                      Bitmap
                    </span>
                    <p className="font-mono text-sm font-bold text-zinc-200">
                      {blockNumber}.bitmap
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs text-zinc-500">
                      Price
                    </span>
                    <p className="font-mono text-sm font-bold text-primary">
                      {priceSats.toLocaleString()} sats
                    </p>
                    <p className="font-mono text-[10px] text-zinc-600">
                      {priceBtc} BTC
                    </p>
                  </div>
                </div>
              </div>

              {/* Seller */}
              <div className="mb-4 flex items-center justify-between">
                <span className="font-mono text-xs text-zinc-500">Seller</span>
                <span className="font-mono text-xs text-zinc-400">
                  {sellerAddress.slice(0, 8)}...{sellerAddress.slice(-6)}
                </span>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => buy(listingId, halfHour || 5)}
              >
                Confirm Purchase
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

          {isComplete && txId && (
            <TransactionSuccess
              txId={txId}
              title="Purchase complete!"
              description={`${blockNumber}.bitmap is now yours`}
              onDone={onClose}
            />
          )}

          {isError && (
            <div className="flex flex-col items-center py-4">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
                <AlertCircle className="h-6 w-6 text-red-400" />
              </div>
              <p className="font-mono text-sm font-bold text-zinc-200">
                Purchase failed
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
