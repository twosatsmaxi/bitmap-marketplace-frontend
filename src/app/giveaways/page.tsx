"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import type { GiveawayWithCount } from "@/lib/types";
import GiveawayCard from "@/components/giveaway/GiveawayCard";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import { Plus } from "lucide-react";

const PAGE_SIZE = 12;

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  return res.json();
};

export default function GiveawaysPage() {
  const [offset, setOffset] = useState(0);
  const { isConnected } = useWalletConnect();

  const { data, error, isLoading } = useSWR<{ giveaways: GiveawayWithCount[] }>(
    `/api/giveaways?limit=${PAGE_SIZE}&offset=${offset}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const giveaways = data?.giveaways ?? [];
  const hasMore = giveaways.length === PAGE_SIZE;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 md:px-4 pb-12 pt-3 md:pt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-mono text-lg md:text-2xl font-black uppercase tracking-[0.08em] text-primary">
            Giveaways
          </h1>
          <p className="font-mono text-[10px] md:text-xs uppercase tracking-[0.14em] text-zinc-500">
            Win bitmaps at locked prices
          </p>
        </div>
        {isConnected && (
          <Link href="/giveaways/create">
            <Button variant="primary" size="sm">
              <Plus className="h-3.5 w-3.5" />
              Create
            </Button>
          </Link>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="home-panel h-48 animate-pulse bg-zinc-900" />
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
            No active giveaways
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {giveaways.map((g) => (
              <GiveawayCard key={g.giveaway.id} data={g} />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              disabled={offset === 0}
              onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!hasMore}
              onClick={() => setOffset((o) => o + PAGE_SIZE)}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
