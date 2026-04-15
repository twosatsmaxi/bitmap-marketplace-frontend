"use client";

import Link from "next/link";
import type { GiveawayWithCount } from "@/lib/types";
import { formatBTC } from "@/lib/utils";
import GiveawayStatusBadge from "./GiveawayStatusBadge";
import { Users, Clock } from "lucide-react";

interface GiveawayCardProps {
  data: GiveawayWithCount;
}

function timeLeft(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "Ended";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h left`;
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
}

export default function GiveawayCard({ data }: GiveawayCardProps) {
  const { giveaway, entry_count } = data;

  return (
    <Link
      href={`/giveaways/${giveaway.id}`}
      className="group home-panel flex flex-col overflow-hidden transition-all duration-200 hover:border-primary/40 hover:bg-primary/[0.02] active:scale-[0.98]"
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b border-[rgba(120,72,18,0.55)] bg-[#0d1117] p-3 md:p-4">
        <div className="flex flex-col gap-1 min-w-0">
          <h3 className="font-mono text-sm md:text-base font-bold uppercase tracking-[0.04em] text-primary truncate">
            {giveaway.title}
          </h3>
          {giveaway.description && (
            <p className="font-mono text-[10px] md:text-xs text-zinc-500 line-clamp-2 normal-case tracking-normal">
              {giveaway.description}
            </p>
          )}
        </div>
        <GiveawayStatusBadge status={giveaway.status} className="flex-shrink-0 ml-2" />
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-2 bg-black/45 p-3 md:p-4">
        {/* Price */}
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] md:text-[10px] uppercase tracking-[0.18em] text-zinc-500">
            Price
          </span>
          <span className="font-mono text-xs md:text-sm font-bold text-text-primary">
            {formatBTC(giveaway.price_sats)}
          </span>
        </div>

        {/* Entries + Deadline */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-zinc-500">
            <Users className="h-3 w-3" />
            <span className="font-mono text-[10px] uppercase tracking-[0.14em]">
              {entry_count} {entry_count === 1 ? "entry" : "entries"}
            </span>
          </div>
          {giveaway.deadline && (
            <div className="flex items-center gap-1 text-zinc-500">
              <Clock className="h-3 w-3" />
              <span className="font-mono text-[10px] uppercase tracking-[0.14em]">
                {timeLeft(giveaway.deadline)}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
