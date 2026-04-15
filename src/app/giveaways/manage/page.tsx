"use client";

import useSWR from "swr";
import type { Giveaway } from "@/lib/types";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import GiveawayStatusBadge from "@/components/giveaway/GiveawayStatusBadge";
import WinnerSelector from "@/components/giveaway/WinnerSelector";
import Button from "@/components/ui/Button";
import { formatBTC, truncateAddr } from "@/lib/utils";
import { cancelGiveaway } from "@/lib/giveaway-api";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  return res.json();
};

export default function ManageGiveawaysPage() {
  const { isConnected } = useWalletConnect();

  const { data, error, isLoading, mutate } = useSWR<{ giveaways: Giveaway[] }>(
    isConnected ? "/api/giveaways/my" : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  if (!isConnected) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-3 md:px-4 pb-12 pt-3 md:pt-4">
        <div className="border border-[rgba(120,72,18,0.55)] bg-[rgba(10,10,12,0.92)] p-12 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-zinc-500">
            Connect your wallet to manage giveaways
          </p>
        </div>
      </div>
    );
  }

  const giveaways = data?.giveaways ?? [];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-3 md:px-4 pb-12 pt-3 md:pt-4">
      <Link
        href="/giveaways"
        className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.14em] text-zinc-500 transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All Giveaways
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="font-mono text-lg md:text-2xl font-black uppercase tracking-[0.08em] text-primary">
          My Giveaways
        </h1>
        <Link href="/giveaways/create">
          <Button variant="primary" size="sm">Create</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="home-panel h-32 animate-pulse bg-zinc-900" />
          ))}
        </div>
      ) : error ? (
        <div className="border border-red-500/20 bg-red-500/5 p-6 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-red-400">
            Failed to load giveaways
          </p>
        </div>
      ) : giveaways.length === 0 ? (
        <div className="border border-[rgba(120,72,18,0.55)] bg-[rgba(10,10,12,0.92)] p-12 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-zinc-500">
            You haven&apos;t created any giveaways yet
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {giveaways.map((g) => (
            <ManageGiveawayRow key={g.id} giveaway={g} onUpdate={() => mutate()} />
          ))}
        </div>
      )}
    </div>
  );
}

function ManageGiveawayRow({
  giveaway,
  onUpdate,
}: {
  giveaway: Giveaway;
  onUpdate: () => void;
}) {
  const [showWinnerSelector, setShowWinnerSelector] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelGiveaway(giveaway.id);
      onUpdate();
    } catch {
      // Error handled silently; user can retry
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="home-panel flex flex-col overflow-hidden">
      <div className="flex items-start justify-between p-4">
        <div className="flex flex-col gap-1 min-w-0">
          <Link
            href={`/giveaways/${giveaway.id}`}
            className="font-mono text-sm md:text-base font-bold uppercase tracking-[0.04em] text-primary hover:underline"
          >
            {giveaway.title}
          </Link>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
              {formatBTC(giveaway.price_sats)}
            </span>
            {giveaway.winner_address && (
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                Winner: {truncateAddr(giveaway.winner_address, 6, 4)}
              </span>
            )}
          </div>
        </div>
        <GiveawayStatusBadge status={giveaway.status} className="flex-shrink-0 ml-2" />
      </div>

      {giveaway.status === "active" && (
        <div className="flex items-center gap-2 border-t border-[rgba(120,72,18,0.35)] px-4 py-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowWinnerSelector((s) => !s)}
          >
            {showWinnerSelector ? "Hide Entries" : "Select Winner"}
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={cancelling}
            onClick={handleCancel}
          >
            Cancel
          </Button>
        </div>
      )}

      {showWinnerSelector && giveaway.status === "active" && (
        <div className="border-t border-[rgba(120,72,18,0.35)] p-4">
          <WinnerSelector
            giveawayId={giveaway.id}
            onWinnerSelected={() => {
              setShowWinnerSelector(false);
              onUpdate();
            }}
          />
        </div>
      )}
    </div>
  );
}
