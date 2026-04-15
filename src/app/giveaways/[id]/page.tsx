"use client";

import { use } from "react";
import useSWR from "swr";
import type { Giveaway } from "@/lib/types";
import { formatBTC, truncateAddr } from "@/lib/utils";
import GiveawayStatusBadge from "@/components/giveaway/GiveawayStatusBadge";
import GiveawayEntryForm from "@/components/giveaway/GiveawayEntryForm";
import { Users, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  return res.json();
};

export default function GiveawayDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data, error, isLoading, mutate } = useSWR<{
    giveaway: Giveaway;
    entry_count: number;
  }>(`/api/giveaways/${id}`, fetcher, { revalidateOnFocus: false });

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-3 md:px-4 pb-12 pt-3 md:pt-4">
        <div className="h-64 animate-pulse bg-zinc-900 border border-[rgba(120,72,18,0.55)]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-3 md:px-4 pb-12 pt-3 md:pt-4">
        <div className="border border-red-500/20 bg-red-500/5 p-6 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-red-400">
            Giveaway not found
          </p>
        </div>
      </div>
    );
  }

  const { giveaway, entry_count } = data;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-3 md:px-4 pb-12 pt-3 md:pt-4">
      {/* Back link */}
      <Link
        href="/giveaways"
        className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.14em] text-zinc-500 transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All Giveaways
      </Link>

      {/* Main card */}
      <div className="home-panel flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[rgba(120,72,18,0.55)] bg-[#0d1117] p-4 md:p-6">
          <div className="flex flex-col gap-2 min-w-0">
            <h1 className="font-mono text-lg md:text-2xl font-black uppercase tracking-[0.04em] text-primary">
              {giveaway.title}
            </h1>
            {giveaway.description && (
              <p className="font-mono text-xs md:text-sm text-zinc-400 normal-case tracking-normal">
                {giveaway.description}
              </p>
            )}
          </div>
          <GiveawayStatusBadge status={giveaway.status} className="flex-shrink-0 ml-3" />
        </div>

        {/* Details */}
        <div className="flex flex-col gap-3 bg-black/45 p-4 md:p-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <DetailItem label="Price" value={formatBTC(giveaway.price_sats)} />
            <DetailItem label="Entries" value={String(entry_count)} icon={<Users className="h-3 w-3" />} />
            <DetailItem label="Owner" value={truncateAddr(giveaway.owner_address, 6, 4)} />
            {giveaway.deadline && (
              <DetailItem
                label="Deadline"
                value={new Date(giveaway.deadline).toLocaleDateString()}
                icon={<Clock className="h-3 w-3" />}
              />
            )}
          </div>

          {giveaway.criteria && (
            <div className="flex flex-col gap-1 border-t border-[rgba(120,72,18,0.35)] pt-3">
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                Criteria
              </span>
              <p className="font-mono text-xs text-zinc-400 normal-case tracking-normal">
                {giveaway.criteria}
              </p>
            </div>
          )}

          {giveaway.winner_address && (
            <div className="flex flex-col gap-1 border-t border-[rgba(120,72,18,0.35)] pt-3">
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                Winner
              </span>
              <p className="font-mono text-sm text-primary">
                {truncateAddr(giveaway.winner_address, 10, 8)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Entry form — only for active giveaways */}
      {giveaway.status === "active" && (
        <GiveawayEntryForm giveawayId={giveaway.id} onEntered={() => mutate()} />
      )}
    </div>
  );
}

function DetailItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[9px] md:text-[10px] uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </span>
      <div className="flex items-center gap-1">
        {icon && <span className="text-zinc-500">{icon}</span>}
        <span className="font-mono text-xs md:text-sm font-bold text-text-primary">
          {value}
        </span>
      </div>
    </div>
  );
}
