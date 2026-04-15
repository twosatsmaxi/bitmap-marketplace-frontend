"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import { enterGiveaway } from "@/lib/giveaway-api";

interface GiveawayEntryFormProps {
  giveawayId: string;
  onEntered?: () => void;
}

export default function GiveawayEntryForm({ giveawayId, onEntered }: GiveawayEntryFormProps) {
  const { isConnected, wallets } = useWalletConnect();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isConnected) {
    return (
      <div className="border border-[rgba(120,72,18,0.55)] bg-[rgba(10,10,12,0.92)] p-4">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-zinc-500">
          Connect your wallet to enter this giveaway
        </p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="border border-emerald-500/30 bg-[#0A1A14] p-4">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-emerald-400">
          Entry submitted successfully
        </p>
      </div>
    );
  }

  const address = wallets[0]?.ordinalsAddress;

  const handleSubmit = async () => {
    if (!address) return;
    setSubmitting(true);
    setError(null);
    try {
      await enterGiveaway(giveawayId, address);
      setSuccess(true);
      onEntered?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to enter giveaway");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 border border-[rgba(120,72,18,0.55)] bg-[rgba(10,10,12,0.92)] p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
          Enter with
        </span>
        <span className="font-mono text-xs text-zinc-400">
          {address}
        </span>
      </div>
      {error && (
        <p className="font-mono text-[10px] text-red-400">{error}</p>
      )}
      <Button
        variant="primary"
        size="md"
        loading={submitting}
        onClick={handleSubmit}
        className="w-full"
      >
        Enter Giveaway
      </Button>
    </div>
  );
}
