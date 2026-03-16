"use client";

import type { CollectionStats } from "@/lib/types";
import CountUp from "@/components/ui/CountUp";
import { formatSats, formatNumber, formatPercent } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsBarProps {
  stats: CollectionStats;
}

interface StatItemData {
  key: string;
  label: string;
  value: number;
  format: "sats" | "number" | "percent";
  highlight?: boolean;
}

export default function StatsBar({ stats }: StatsBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const statItems: StatItemData[] = [
    { key: "floor", label: "Floor", value: stats.floorPrice, format: "sats", highlight: true },
    { key: "volume", label: "24h Vol", value: stats.totalVolume, format: "sats" },
    { key: "avg", label: "24h Avg", value: stats.avgPrice24h, format: "sats" },
    { key: "change", label: "24h Change", value: stats.change24h, format: "percent" },
    { key: "listed", label: "Listed", value: stats.listedCount, format: "number" },
    { key: "holders", label: "Holders", value: stats.holders, format: "number" },
  ];

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      return () => el.removeEventListener("scroll", checkScroll);
    }
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const formatValue = (item: StatItemData) => {
    switch (item.format) {
      case "sats":
        return formatSats(item.value);
      case "number":
        return formatNumber(item.value);
      case "percent":
        return formatPercent(item.value);
      default:
        return String(item.value);
    }
  };

  return (
    <div className="fixed left-0 right-0 top-nav z-40 flex h-stats-bar items-center border-b border-[rgba(120,72,18,0.55)] bg-[rgba(9,9,11,0.95)] backdrop-blur-md">
      {/* Preview Label - Desktop */}
      <div className="hidden h-full items-center border-r border-[rgba(120,72,18,0.45)] bg-[rgba(247,147,26,0.06)] px-4 md:flex md:px-6">
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          <span className="h-1.5 w-1.5 bg-primary opacity-60"></span>
          Preview
        </span>
      </div>

      {/* Stats Content */}
      <div className="relative flex flex-1 items-center overflow-hidden">
        {/* Mobile Scroll Indicators */}
        <button
          onClick={() => scroll("left")}
          className={cn(
            "absolute left-0 z-10 flex h-full w-8 items-center justify-center bg-gradient-to-r from-[rgba(9,9,11,1)] to-transparent transition-opacity md:hidden",
            canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-4 w-4 text-zinc-500" />
        </button>

        <button
          onClick={() => scroll("right")}
          className={cn(
            "absolute right-0 z-10 flex h-full w-8 items-center justify-center bg-gradient-to-l from-[rgba(9,9,11,1)] to-transparent transition-opacity md:hidden",
            canScrollRight ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          aria-label="Scroll right"
        >
          <ChevronRight className="h-4 w-4 text-zinc-500" />
        </button>

        {/* Stats Scroll Container */}
        <div
          ref={scrollRef}
          className="flex w-full items-center gap-1 overflow-x-auto px-3 hide-scrollbar md:gap-6 md:overflow-visible md:px-6"
        >
          {statItems.map((item) => (
            <div
              key={item.key}
              className="flex flex-shrink-0 items-center gap-2 px-3 py-1 md:px-0"
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500 md:text-[10px]">
                {item.label}:
              </span>
              <span
                className={cn(
                  "font-mono text-xs font-bold md:text-sm",
                  item.highlight
                    ? "text-primary"
                    : item.format === "percent"
                    ? item.value >= 0
                      ? "text-success"
                      : "text-danger"
                    : "text-zinc-300"
                )}
              >
                <CountUp end={item.value} formatFn={() => formatValue(item)} />
              </span>
            </div>
          ))}

          {/* Listed percentage - Desktop only */}
          <div className="hidden items-center gap-2 border-l border-[rgba(120,72,18,0.45)] pl-4 md:flex">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
              Listed %:
            </span>
            <span className="font-mono text-sm font-bold text-zinc-300">
              {((stats.listedCount / stats.totalSupply) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
