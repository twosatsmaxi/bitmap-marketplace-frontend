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

function WalletPill({
  w,
  isActive,
  onClick,
}: {
  w: WalletInfo;
  isActive: boolean;
  onClick: () => void;
}) {
  const display = w.label
    ? `${w.label}·${shortAddr(w.address)}`
    : shortAddr(w.address);
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 border px-1.5 py-0.5 font-mono text-[9px] transition-colors whitespace-nowrap",
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
      {display}
    </button>
  );
}

export default function CompactProfileHeader({
  headerRef,
  wallets,
  bitmapCount,
  traits,
  activeTrait,
  onTraitClick,
  activeWallet,
  onWalletClick,
}: CompactProfileHeaderProps) {
  const [visible, setVisible] = useState(false);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [walletSearch, setWalletSearch] = useState("");
  const overflowRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const traitsRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          // Show immediately
          if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
          setVisible(true);
        } else {
          // Delay hide to avoid flicker during content transitions
          hideTimerRef.current = setTimeout(() => setVisible(false), 150);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [headerRef]);

  // Close dropdown on outside click, reset search on close
  useEffect(() => {
    if (!overflowOpen) {
      setWalletSearch("");
      return;
    }
    // Focus search on open
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
    const isActiveInFirstN = !activeWallet || firstN.some((w) => w.address === activeWallet);
    if (isActiveInFirstN) return firstN;
    // Replace last visible with active wallet
    const active = wallets.find((w) => w.address === activeWallet);
    if (!active) return firstN;
    return [...firstN.slice(0, MAX_VISIBLE - 1), active];
  })();
  const overflowWallets = wallets.filter(
    (w) => !visibleWallets.some((v) => v.address === w.address)
  );
  const hasOverflow = overflowWallets.length > 0;

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
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-1.5 md:gap-3 md:px-4">
        {/* Title */}
        <h2 className="flex-shrink-0 font-mono text-xs font-black uppercase tracking-[0.1em] text-primary md:text-sm">
          Profile
        </h2>

        {/* Bitmap count */}
        {bitmapCount > 0 && (
          <span className="flex-shrink-0 border border-[rgba(120,72,18,0.4)] bg-[rgba(120,72,18,0.12)] rounded px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-zinc-400 md:text-[9px]">
            <span className="text-primary">{bitmapCount}</span> bitmap
            {bitmapCount !== 1 ? "s" : ""}
          </span>
        )}

        {/* Wallet pills */}
        {wallets.length > 0 && (
          <>
            <div className="h-4 w-px flex-shrink-0 bg-[rgba(120,72,18,0.4)]" />
            <div className="flex flex-shrink-0 items-center gap-1">
              {visibleWallets.map((w) => (
                <WalletPill
                  key={w.address}
                  w={w}
                  isActive={activeWallet === w.address}
                  onClick={() => handleWalletClick(w.address)}
                />
              ))}
              {hasOverflow && (
                <div ref={overflowRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setOverflowOpen((p) => !p)}
                    className="border border-[rgba(120,72,18,0.4)] bg-[rgba(120,72,18,0.12)] px-1.5 py-0.5 font-mono text-[9px] text-zinc-500 transition-colors hover:text-zinc-300"
                  >
                    +{overflowWallets.length}
                  </button>
                  {overflowOpen && (
                    <div className="absolute left-0 top-full mt-1 w-52 rounded border border-[rgba(120,72,18,0.55)] bg-[rgba(9,9,11,0.97)] shadow-lg backdrop-blur-md">
                      {/* Search */}
                      <div className="border-b border-[rgba(120,72,18,0.3)] p-1.5">
                        <input
                          ref={searchRef}
                          type="text"
                          value={walletSearch}
                          onChange={(e) => setWalletSearch(e.target.value)}
                          placeholder="Search wallets…"
                          className="w-full bg-transparent font-mono text-[10px] text-zinc-300 placeholder:text-zinc-600 outline-none"
                        />
                      </div>
                      {/* Scrollable list */}
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

        {/* Divider before traits */}
        {traits.length > 0 && (
          <div className="h-4 w-px flex-shrink-0 bg-[rgba(120,72,18,0.4)]" />
        )}

        {/* Scrollable trait pills */}
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
