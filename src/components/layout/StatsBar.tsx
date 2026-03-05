"use client";

import type { CollectionStats } from "@/lib/types";
import CountUp from "@/components/ui/CountUp";
import { formatSats, formatNumber, formatPercent } from "@/lib/utils";

export default function StatsBar({ stats }: { stats: CollectionStats }) {
  return (
    <div className="fixed top-nav left-0 right-0 h-stats-bar bg-surface border-b border-border z-40 flex items-center px-6 overflow-x-auto hide-scrollbar">
      <div className="flex items-center gap-8 w-full max-w-7xl mx-auto text-xs whitespace-nowrap">
        <StatItem label="Floor">
          <span className="text-primary font-mono font-medium">
            <CountUp end={stats.floorPrice} formatFn={formatSats} />
          </span>
        </StatItem>
        <StatItem label="24h Vol">
          <span className="font-mono font-medium">
            <CountUp end={stats.totalVolume} formatFn={formatSats} />
          </span>
        </StatItem>
        <StatItem label="24h Avg">
          <span className="font-mono">
            <CountUp end={stats.avgPrice24h} formatFn={formatSats} />
          </span>
        </StatItem>
        <StatItem label="24h Change">
          <span className={stats.change24h >= 0 ? "text-success" : "text-red-500"}>
            <CountUp end={stats.change24h} formatFn={formatPercent} />
          </span>
        </StatItem>
        <div className="w-px h-4 bg-border mx-2" />
        <StatItem label="Listed">
          <span className="font-mono">
            <CountUp end={stats.listedCount} formatFn={formatNumber} />
            <span className="text-text-secondary ml-1">
              ({((stats.listedCount / stats.totalSupply) * 100).toFixed(2)}%)
            </span>
          </span>
        </StatItem>
        <StatItem label="Holders">
          <span className="font-mono">
            <CountUp end={stats.holders} formatFn={formatNumber} />
          </span>
        </StatItem>
      </div>
    </div>
  );
}

function StatItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-text-secondary">{label}</span>
      {children}
    </div>
  );
}
