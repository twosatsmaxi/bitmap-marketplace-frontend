"use client";

import type { CollectionStats } from "@/lib/types";
import CountUp from "@/components/ui/CountUp";
import { formatSats, formatNumber, formatPercent } from "@/lib/utils";

export default function StatsBar({ stats }: { stats: CollectionStats }) {
  return (
    <div className="fixed left-0 right-0 top-nav z-40 flex h-stats-bar items-center overflow-x-auto border-b border-[rgba(120,72,18,0.55)] bg-[rgba(9,9,11,0.9)] hide-scrollbar">
      <div className="mx-auto flex h-full w-full max-w-7xl items-center whitespace-nowrap font-mono text-xs tracking-wide">
        <div className="flex h-full items-center border-r border-[rgba(120,72,18,0.45)] bg-[rgba(247,147,26,0.06)] px-4 text-[10px] uppercase tracking-[0.2em] text-zinc-500 md:px-6">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 bg-primary opacity-60"></span>
            Preview
          </span>
        </div>
        
        <div className="flex items-center gap-6 px-4 md:gap-8 md:px-6">
          <StatItem label="Floor">
            <span className="text-primary font-bold">
              <CountUp end={stats.floorPrice} formatFn={formatSats} />
            </span>
          </StatItem>
          <StatItem label="24h Vol">
            <span className="text-zinc-300">
              <CountUp end={stats.totalVolume} formatFn={formatSats} />
            </span>
          </StatItem>
          <StatItem label="24h Avg">
            <span className="text-zinc-300">
              <CountUp end={stats.avgPrice24h} formatFn={formatSats} />
            </span>
          </StatItem>
          <StatItem label="24h Change">
            <span className={stats.change24h >= 0 ? "text-success" : "text-danger"}>
              <CountUp end={stats.change24h} formatFn={formatPercent} />
            </span>
          </StatItem>
          <div className="mx-2 h-4 w-px bg-[rgba(120,72,18,0.45)]" />
          <StatItem label="Listed">
            <span className="text-zinc-300">
              <CountUp end={stats.listedCount} formatFn={formatNumber} />
              <span className="ml-1.5 text-[10px] text-zinc-500">
                ({((stats.listedCount / stats.totalSupply) * 100).toFixed(1)}%)
              </span>
            </span>
          </StatItem>
          <StatItem label="Holders">
            <span className="text-zinc-300">
              <CountUp end={stats.holders} formatFn={formatNumber} />
            </span>
          </StatItem>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-zinc-500 uppercase text-[10px] tracking-[0.16em]">{label}:</span>
      {children}
    </div>
  );
}
