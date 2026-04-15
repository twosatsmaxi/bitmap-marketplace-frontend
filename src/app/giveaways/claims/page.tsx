"use client";

import useSWR from "swr";
import type { Giveaway } from "@/lib/types";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import GiveawayStatusBadge from "@/components/giveaway/GiveawayStatusBadge";
import { formatBTC, truncateAddr } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  return res.json();
};

export default function ClaimsPage() {
  const { isConnected, wallets } = useWalletConnect();
  const address = wallets[0]?.ordinalsAddress;

  const { data, error, isLoading } = useSWR<{ giveaways: Giveaway[] }>(
    address ? `/api/giveaways/claims?address=${encodeURIComponent(address)}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  if (!isConnected) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-3 md:px-4 pb-12 pt-3 md:pt-4">
        <div className="border border-[rgba(120,72,18,0.55)] bg-[rgba(10,10,12,0.92)] p-12 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-zinc-500">
            Connect your wallet to see claimable giveaways
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

      <div className="flex flex-col gap-1">
        <h1 className="font-mono text-lg md:text-2xl font-black uppercase tracking-[0.08em] text-primary">
          Claim Listings
        </h1>
        <p className="font-mono text-[10px] md:text-xs uppercase tracking-[0.14em] text-zinc-500">
          Giveaways you&apos;ve won — claim the locked listing
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="home-panel h-24 animate-pulse bg-zinc-900" />
          ))}
        </div>
      ) : error ? (
        <div className="border border-red-500/20 bg-red-500/5 p-6 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-red-400">
            Failed to load claims
          </p>
        </div>
      ) : giveaways.length === 0 ? (
        <div className="border border-[rgba(120,72,18,0.55)] bg-[rgba(10,10,12,0.92)] p-12 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-zinc-500">
            No claimable giveaways
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {giveaways.map((g) => (
            <Link
              key={g.id}
              href={`/giveaways/${g.id}`}
              className="home-panel flex items-center justify-between p-4 transition-all hover:border-primary/40 hover:bg-primary/[0.02] active:scale-[0.99]"
            >
              <div className="flex flex-col gap-1 min-w-0">
                <span className="font-mono text-sm font-bold uppercase tracking-[0.04em] text-primary truncate">
                  {g.title}
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                    {formatBTC(g.price_sats)}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                    From: {truncateAddr(g.owner_address, 6, 4)}
                  </span>
                </div>
              </div>
              <GiveawayStatusBadge status={g.status} className="flex-shrink-0 ml-2" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
