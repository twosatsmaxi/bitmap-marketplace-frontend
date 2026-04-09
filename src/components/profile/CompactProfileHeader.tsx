"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { TraitStat } from "@/lib/api";

interface CompactProfileHeaderProps {
  /** Ref to the original header element to observe */
  headerRef: React.RefObject<HTMLDivElement | null>;
  walletCount: number;
  bitmapCount: number;
  traits: TraitStat[];
  activeTrait: string | null;
  onTraitClick: (name: string) => void;
}

export default function CompactProfileHeader({
  headerRef,
  walletCount,
  bitmapCount,
  traits,
  activeTrait,
  onTraitClick,
}: CompactProfileHeaderProps) {
  const [visible, setVisible] = useState(false);
  const traitsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [headerRef]);

  return (
    <div
      className={cn(
        "fixed left-0 right-0 top-[var(--header-total)] z-40",
        "border-b border-[rgba(120,72,18,0.55)] bg-[rgba(9,9,11,0.7)] backdrop-blur-md",
        "transition-all duration-300 ease-out",
        visible
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0 pointer-events-none"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-2 md:px-4">
        {/* Title */}
        <h2 className="flex-shrink-0 font-mono text-xs font-black uppercase tracking-[0.1em] text-primary md:text-sm">
          Profile
        </h2>

        {/* Stats pills — match original header badge style */}
        <div className="flex flex-shrink-0 items-center gap-1.5">
          <span className="border border-[rgba(120,72,18,0.4)] bg-[rgba(120,72,18,0.12)] rounded px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-zinc-400 md:text-[9px]">
            {walletCount} wallet{walletCount !== 1 ? "s" : ""}
          </span>
          {bitmapCount > 0 && (
            <span className="border border-[rgba(120,72,18,0.4)] bg-[rgba(120,72,18,0.12)] rounded px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-zinc-400 md:text-[9px]">
              <span className="text-primary">{bitmapCount}</span> bitmap{bitmapCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Divider */}
        {traits.length > 0 && (
          <div className="h-4 w-px flex-shrink-0 bg-[rgba(120,72,18,0.4)]" />
        )}

        {/* Scrollable trait pills — exact match to TraitPill in MultiWalletPortfolioGrid */}
        {traits.length > 0 && (
          <div
            ref={traitsRef}
            className="hide-scrollbar flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto"
          >
            {traits.map((trait) => {
              const isActive = activeTrait === trait.name;
              return (
                <button
                  key={trait.name}
                  onClick={() => onTraitClick(trait.name)}
                  className={cn(
                    "inline-flex flex-shrink-0 items-center gap-1 rounded-md px-2 py-1 font-mono text-[9px] transition-all",
                    "border hover:scale-105 active:scale-95",
                    isActive
                      ? "bg-primary text-black border-primary font-bold"
                      : "bg-[rgba(120,72,18,0.2)] text-primary border-[rgba(120,72,18,0.4)] hover:border-primary"
                  )}
                >
                  <span className="capitalize whitespace-nowrap">
                    {trait.name.replace(/_/g, " ")}
                  </span>
                  <span
                    className={cn(
                      "px-1 rounded text-[8px]",
                      isActive ? "bg-black/20" : "bg-black/30"
                    )}
                  >
                    {trait.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
