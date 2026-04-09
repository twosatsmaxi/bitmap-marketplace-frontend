"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { TraitStat } from "@/lib/api";

interface WalletInfo {
  address: string;
  label: string | null;
}

interface CompactProfileHeaderProps {
  headerRef: React.RefObject<HTMLDivElement | null>;
  /** Ref to the traits section — compact header appears after this scrolls out */
  traitsSectionRef?: React.RefObject<HTMLDivElement>;
  wallets: WalletInfo[];
  bitmapCount: number;
  traits: TraitStat[];
  activeTrait: string | null;
  onTraitClick: (name: string) => void;
  activeWallet?: string | null;
  onWalletClick?: (address: string) => void;
}

const MAX_VISIBLE = 3;

function shortAddr(addr: string): string {
  if (addr.length <= 8) return addr;
  return addr.slice(-4);
}

/**
 * Returns opacity and translateY based on scroll progress and element index.
 * Each element "arrives" at a staggered point along the 0→1 progress.
 */
function staggerStyle(
  index: number,
  totalItems: number,
  progress: number
): React.CSSProperties {
  // Items only start appearing after traits scroll out
  // Wider stagger range = more scroll distance between each item appearing
  const staggerRange = 0.8; // spread across 80% of progress (0.2→1.0)
  const baseStart = 0.2;
  const step = totalItems > 1 ? staggerRange / totalItems : 0;
  const itemStart = baseStart + index * step;

  // Each item takes 30% of progress to fully reveal
  const itemProgress = Math.max(0, Math.min(1, (progress - itemStart) / 0.3));

  // Ease out cubic
  const eased = 1 - Math.pow(1 - itemProgress, 3);

  return {
    opacity: eased,
    transform: `translateY(${(1 - eased) * 8}px)`,
    // No CSS transition — driven directly by scroll for instant response
  };
}

function WalletPill({
  w,
  isActive,
  onClick,
}: {
  w: WalletInfo;
  isActive: boolean;
  onClick: () => void;
}) {
  const mobileDisplay = w.label
    ? `${w.label}·${w.address.slice(-2)}`
    : w.address.slice(-2);
  const desktopDisplay = w.label
    ? `${w.label}·${shortAddr(w.address)}`
    : shortAddr(w.address);
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 border px-1.5 py-0.5 font-mono text-[10px] md:text-xs whitespace-nowrap",
        isActive
          ? "border-primary bg-[rgba(247,147,26,0.12)] text-primary"
          : "border-[rgba(120,72,18,0.4)] bg-[rgba(247,147,26,0.04)] text-zinc-500 hover:text-zinc-300"
      )}
    >
      <span
        className={cn(
          "h-1 w-1 flex-shrink-0 rounded-full",
          isActive ? "bg-primary" : "bg-primary/50"
        )}
      />
      <span className="md:hidden">{mobileDisplay}</span>
      <span className="hidden md:inline">{desktopDisplay}</span>
    </button>
  );
}

export default function CompactProfileHeader({
  headerRef,
  traitsSectionRef,
  wallets,
  bitmapCount,
  traits,
  activeTrait,
  onTraitClick,
  activeWallet,
  onWalletClick,
}: CompactProfileHeaderProps) {
  // progress: 0 = header fully visible, 1 = header fully scrolled out
  const [progress, setProgress] = useState(0);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [walletSearch, setWalletSearch] = useState("");
  const overflowRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const traitsRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const headerEl = headerRef.current;
    if (!headerEl) return;

    const headerTotal = parseInt(
      getComputedStyle(document.documentElement)
        .getPropertyValue("--header-total")
        .trim(),
      10
    ) || 104;

    const update = () => {
      // Use traits section bottom if available, else header bottom
      const traitsEl = traitsSectionRef?.current;
      const trackEl = traitsEl || headerEl;
      const rect = trackEl.getBoundingClientRect();
      // progress: 0 = tracked element fully visible below fixed bars
      //           1 = tracked element has fully scrolled above fixed bars
      const p = Math.max(
        0,
        Math.min(1, 1 - (rect.bottom - headerTotal) / rect.height)
      );
      setProgress(p);
    };

    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [headerRef, traitsSectionRef]);

  // Close dropdown on outside click, reset search on close
  useEffect(() => {
    if (!overflowOpen) {
      setWalletSearch("");
      return;
    }
    requestAnimationFrame(() => searchRef.current?.focus());
    const handler = (e: MouseEvent) => {
      if (
        overflowRef.current &&
        !overflowRef.current.contains(e.target as Node)
      ) {
        setOverflowOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [overflowOpen]);

  const handleWalletClick = useCallback(
    (addr: string) => {
      onWalletClick?.(addr);
      setOverflowOpen(false);
    },
    [onWalletClick]
  );

  // If active wallet is in overflow, swap it into the visible set
  const visibleWallets = (() => {
    if (wallets.length <= MAX_VISIBLE) return wallets;
    const firstN = wallets.slice(0, MAX_VISIBLE);
    const isActiveInFirstN =
      !activeWallet || firstN.some((w) => w.address === activeWallet);
    if (isActiveInFirstN) return firstN;
    const active = wallets.find((w) => w.address === activeWallet);
    if (!active) return firstN;
    return [...firstN.slice(0, MAX_VISIBLE - 1), active];
  })();
  const overflowWallets = wallets.filter(
    (w) => !visibleWallets.some((v) => v.address === w.address)
  );
  const hasOverflow = overflowWallets.length > 0;

  const visible = progress > 0.5;

  // Count total items for stagger distribution
  let totalItems = 1; // title
  if (bitmapCount > 0) totalItems++;
  if (wallets.length > 0) totalItems += 1 + visibleWallets.length + (hasOverflow ? 1 : 0); // divider + pills + overflow
  if (traits.length > 0) totalItems += 1 + traits.length; // divider + traits

  let idx = 0;

  return (
    <div
      className={cn(
        "fixed left-0 right-0 top-[var(--header-total)] z-40",
        "border-b border-[rgba(120,72,18,0.55)] bg-[rgba(9,9,11,0.7)] backdrop-blur-md",
        !visible && "pointer-events-none"
      )}
      style={{
        opacity: Math.max(0, Math.min(1, (progress - 0.5) / 0.2)),
      }}
    >
      <div className="mx-auto max-w-7xl px-3 py-1.5 md:px-4">
        {/* Mobile: two rows. Desktop: single row */}
        {/* Row 1: Profile + count + wallets (+ traits on desktop) */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Title */}
          <h2
            style={staggerStyle(idx++, totalItems, progress)}
            className="flex-shrink-0 font-mono text-xs font-black uppercase tracking-[0.1em] text-primary md:text-sm"
          >
            Profile
          </h2>

          {/* Bitmap count */}
          {bitmapCount > 0 && (
            <span
              style={staggerStyle(idx++, totalItems, progress)}
              className="flex-shrink-0 border border-[rgba(120,72,18,0.4)] bg-[rgba(120,72,18,0.12)] rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-400 md:text-xs"
            >
              <span className="text-primary">{bitmapCount}</span> bitmap
              {bitmapCount !== 1 ? "s" : ""}
            </span>
          )}

          {/* Wallet pills */}
          {wallets.length > 0 && (
            <>
              <div
                style={staggerStyle(idx++, totalItems, progress)}
                className="h-4 w-px flex-shrink-0 bg-[rgba(120,72,18,0.4)]"
              />
              <div className="flex flex-shrink-0 items-center gap-1">
                {visibleWallets.map((w) => {
                  const i = idx++;
                  return (
                    <div key={w.address} style={staggerStyle(i, totalItems, progress)}>
                      <WalletPill
                        w={w}
                        isActive={activeWallet === w.address}
                        onClick={() => handleWalletClick(w.address)}
                      />
                    </div>
                  );
                })}
                {hasOverflow && (
                  <div
                    ref={overflowRef}
                    className="relative"
                    style={staggerStyle(idx++, totalItems, progress)}
                  >
                    <button
                      type="button"
                      onClick={() => setOverflowOpen((p) => !p)}
                      className="border border-[rgba(120,72,18,0.4)] bg-[rgba(120,72,18,0.12)] px-1.5 py-0.5 font-mono text-[10px] md:text-xs text-zinc-500 transition-colors hover:text-zinc-300"
                    >
                      +{overflowWallets.length}
                    </button>
                    {overflowOpen && (
                      <div className="absolute right-0 top-full mt-1 w-52 rounded border border-[rgba(120,72,18,0.55)] bg-[rgba(9,9,11,0.97)] shadow-lg backdrop-blur-md md:left-0 md:right-auto">
                        <div className="border-b border-[rgba(120,72,18,0.3)] p-1.5">
                          <input
                            ref={searchRef}
                            type="text"
                            value={walletSearch}
                            onChange={(e) => setWalletSearch(e.target.value)}
                            placeholder="Search wallets…"
                            className="w-full bg-transparent font-mono text-[10px] md:text-xs text-zinc-300 placeholder:text-zinc-600 outline-none"
                          />
                        </div>
                        <div className="hide-scrollbar flex max-h-48 flex-col gap-0.5 overflow-y-auto p-1">
                          {overflowWallets
                            .filter((w) => {
                              if (!walletSearch) return true;
                              const q = walletSearch.toLowerCase();
                              return (
                                (w.label?.toLowerCase().includes(q) ?? false) ||
                                w.address.toLowerCase().includes(q)
                              );
                            })
                            .map((w) => (
                              <WalletPill
                                key={w.address}
                                w={w}
                                isActive={activeWallet === w.address}
                                onClick={() => handleWalletClick(w.address)}
                              />
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Divider + traits — inline on desktop only */}
          {traits.length > 0 && (
            <div
              style={staggerStyle(idx, totalItems, progress)}
              className="hidden h-4 w-px flex-shrink-0 bg-[rgba(120,72,18,0.4)] md:block"
            />
          )}
          {traits.length > 0 && (
            <div
              ref={traitsRef}
              className="hide-scrollbar hidden min-w-0 flex-1 items-center gap-1.5 overflow-x-auto md:flex"
            >
              {traits.map((trait) => {
                const i = idx++;
                const isActive = activeTrait === trait.name;
                return (
                  <button
                    key={trait.name}
                    style={staggerStyle(i, totalItems, progress)}
                    onClick={() => onTraitClick(trait.name)}
                    className={cn(
                      "inline-flex flex-shrink-0 items-center gap-1 rounded-md px-2 py-1 font-mono text-[10px] md:text-xs",
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
                        "px-1 rounded text-[9px] md:text-[10px]",
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

        {/* Row 2: Traits — mobile only */}
        {traits.length > 0 && (
          <div
            className="hide-scrollbar mt-1.5 flex items-center gap-1.5 overflow-x-auto md:hidden"
          >
            {traits.map((trait) => {
              const isActive = activeTrait === trait.name;
              return (
                <button
                  key={trait.name}
                  onClick={() => onTraitClick(trait.name)}
                  className={cn(
                    "inline-flex flex-shrink-0 items-center gap-1 rounded-md px-2 py-1 font-mono text-[10px] md:text-xs",
                    "border active:scale-95",
                    isActive
                      ? "bg-primary text-black border-primary font-bold"
                      : "bg-[rgba(120,72,18,0.2)] text-primary border-[rgba(120,72,18,0.4)]"
                  )}
                >
                  <span className="capitalize whitespace-nowrap">
                    {trait.name.replace(/_/g, " ")}
                  </span>
                  <span
                    className={cn(
                      "px-1 rounded text-[9px] md:text-[10px]",
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
