"use client";

import type { CollectionStats } from "@/lib/types";
import CountUp from "@/components/ui/CountUp";
import { formatSats, formatNumber, formatPercent } from "@/lib/utils";

export default function StatsBar({ stats }: { stats: CollectionStats }) {
  return (
    <div className="fixed top-nav left-0 right-0 h-stats-bar bg-surface border-b border-border z-40 flex items-center overflow-x-auto hide-scrollbar">
      <div className="flex items-center h-full w-full max-w-7xl mx-auto text-xs whitespace-nowrap font-mono tracking-wide">
        <div className="px-4 md:px-6 flex items-center h-full border-r border-border/50 bg-surface-2 text-[10px] uppercase text-text-secondary tracking-[0.2em]">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></span>
            Syncing
          </span>
        </div>
        
        <div className="flex items-center gap-6 md:gap-8 px-4 md:px-6">
          <StatItem label="Floor">
            <span className="text-primary font-bold">
              <CountUp end={stats.floorPrice} formatFn={formatSats} />
            </span>
          </StatItem>
          <StatItem label="24h Vol">
            <span className="text-text-primary">
              <CountUp end={stats.totalVolume} formatFn={formatSats} />
            </span>
          </StatItem>
          <StatItem label="24h Avg">
            <span className="text-text-primary">
              <CountUp end={stats.avgPrice24h} formatFn={formatSats} />
            </span>
          </StatItem>
          <StatItem label="24h Change">
            <span className={stats.change24h >= 0 ? "text-success" : "text-danger"}>
              <CountUp end={stats.change24h} formatFn={formatPercent} />
            </span>
          </StatItem>
          <div className="w-px h-4 bg-border/50 mx-2" />
          <StatItem label="Listed">
            <span className="text-text-primary">
              <CountUp end={stats.listedCount} formatFn={formatNumber} />
              <span className="text-text-secondary ml-1.5 text-[10px]">
                ({((stats.listedCount / stats.totalSupply) * 100).toFixed(1)}%)
              </span>
            </span>
          </StatItem>
          <StatItem label="Holders">
            <span className="text-text-primary">
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
      <span className="text-text-secondary uppercase text-[10px] tracking-[0.16em]">{label}:</span>
      {children}
    </div>
  );
}
