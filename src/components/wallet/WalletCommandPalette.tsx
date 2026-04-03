"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";
import { detectWallets, type WalletProvider } from "@/lib/wallet-service";
import { type Profile } from "@/lib/auth-api";
import { cn, truncateAddr } from "@/lib/utils";

interface WalletCommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onSelect: (provider: WalletProvider) => void;
  isConnecting: boolean;
  connectingProvider: WalletProvider | null;
  connectedProfile: Profile | null;
  onGoToPortfolio: () => void;
  error: string | null;
}

const SPINNER_FRAMES = ["|", "/", "-", "\\"];

const PIXEL_RAIN = [
  { left: "8%",  size: "4px", duration: 6,  delay: 0 },
  { left: "24%", size: "3px", duration: 8,  delay: 1.2 },
  { left: "45%", size: "5px", duration: 7,  delay: 0.5 },
  { left: "62%", size: "3px", duration: 9,  delay: 2.1 },
  { left: "78%", size: "4px", duration: 6.5, delay: 0.8 },
  { left: "91%", size: "3px", duration: 7.5, delay: 1.8 },
];

// Precomputed styles to avoid recreating objects every render
const GRID_STYLE = {
  backgroundImage:
    "linear-gradient(rgba(255,187,0,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,187,0,0.045) 1px, transparent 1px)",
  backgroundSize: "28px 28px",
} as const;

const PIXEL_STYLES = PIXEL_RAIN.map((p) => ({
  left: p.left,
  width: p.size,
  height: p.size,
  background: "rgba(247, 147, 26, 0.12)",
  outline: "1px solid rgba(126, 73, 18, 0.24)",
  animation: `home-pixel-rain ${p.duration}s linear ${p.delay}s infinite`,
}));

export default function WalletCommandPalette({
  open,
  onClose,
  onSelect,
  isConnecting,
  connectingProvider,
  connectedProfile,
  onGoToPortfolio,
  error,
}: WalletCommandPaletteProps) {
  const [wallets, setWallets] = useState(() => detectWallets());
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [spinnerFrame, setSpinnerFrame] = useState(0);
  const [bitmapCount, setBitmapCount] = useState<number | null>(null);

  // Refs for stable keyboard handler
  const stateRef = useRef({ wallets, selectedIndex, onClose, onSelect, onGoToPortfolio, open, connectedProfile });
  stateRef.current = { wallets, selectedIndex, onClose, onSelect, onGoToPortfolio, open, connectedProfile };

  useEffect(() => {
    if (open) {
      setWallets(detectWallets());
      setSelectedIndex(0);
      setBitmapCount(null);
    }
  }, [open]);

  useEffect(() => {
    if (!isConnecting) return;
    const id = setInterval(() => {
      setSpinnerFrame((prev) => (prev + 1) % SPINNER_FRAMES.length);
    }, 150);
    return () => clearInterval(id);
  }, [isConnecting]);

  // Fetch bitmap count when connected
  useEffect(() => {
    if (!connectedProfile) {
      setBitmapCount(null);
      return;
    }
    let stale = false;
    const addresses = connectedProfile.wallets.map((w) => w.ordinalsAddress);
    fetch("/api/portfolio/multi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addresses }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!stale) setBitmapCount(data.total ?? 0);
      })
      .catch(() => {
        if (!stale) setBitmapCount(0);
      });
    return () => { stale = true; };
  }, [connectedProfile]);

  // Stable keyboard handler — reads from ref so it never needs re-registration
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      const { wallets, selectedIndex, onClose, onSelect, onGoToPortfolio, connectedProfile } = stateRef.current;

      // Connected screen: only Enter and Escape
      if (connectedProfile) {
        if (e.key === "Enter") {
          e.preventDefault();
          onGoToPortfolio();
        } else if (e.key === "Escape") {
          e.preventDefault();
          onClose();
        }
        return;
      }

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          onClose();
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev === 0 ? wallets.length - 1 : prev - 1));
          break;
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev === wallets.length - 1 ? 0 : prev + 1));
          break;
        case "Enter":
          e.preventDefault();
          if (wallets[selectedIndex]?.installed) {
            onSelect(wallets[selectedIndex].provider);
          }
          break;
        case "1":
          e.preventDefault();
          if (wallets[0]?.installed) {
            setSelectedIndex(0);
            onSelect(wallets[0].provider);
          }
          break;
        case "2":
          e.preventDefault();
          if (wallets[1]?.installed) {
            setSelectedIndex(1);
            onSelect(wallets[1].provider);
          }
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  if (!open) return null;

  // Connected info screen
  if (connectedProfile) {
    const primaryWallet = connectedProfile.wallets[0];
    const walletLabel = connectingProvider ?? primaryWallet?.label ?? "Wallet";
    const addr = primaryWallet?.ordinalsAddress ?? connectedProfile.primaryAddress;

    return createPortal(
      <div className="fixed inset-0 z-[100] flex justify-center">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div
          className={cn(
            "relative mt-24 h-fit w-[420px] max-w-[calc(100vw-2rem)]",
            "border border-[rgba(120,72,18,0.55)]",
            "bg-[rgba(7,7,9,0.98)]",
            "shadow-[0_0_60px_rgba(247,147,26,0.08)]",
            "animate-fadeUp overflow-hidden",
          )}
        >
          {/* Grid background */}
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
            style={GRID_STYLE}
          />
          {/* Pixel rain */}
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            {PIXEL_STYLES.map((style, i) => (
              <span key={i} className="absolute" style={style} />
            ))}
          </div>

          {/* Terminal Prompt Line */}
          <div className="px-4 py-3 border-b border-[rgba(120,72,18,0.35)]">
            <span className="font-mono text-sm text-emerald-500">{"> wallet_connected"}</span>
            <span className="ml-2 font-mono text-sm text-emerald-500">{"✓"}</span>
          </div>

          {/* Wallet Info */}
          <div className="px-4 py-4 space-y-3">
            <InfoRow label="WALLET" value={String(walletLabel)} />
            <InfoRow label="ADDR" value={truncateAddr(addr, 8, 6)} />
            <div className="flex items-center gap-3">
              <span className="w-20 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-600">
                Bitmaps
              </span>
              {bitmapCount === null ? (
                <div className="h-4 w-16 animate-shimmer rounded-sm bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 bg-[length:200%_100%]" />
              ) : (
                <span className="font-mono text-sm font-bold text-zinc-200">
                  {bitmapCount.toLocaleString("en-US")}
                </span>
              )}
            </div>
            {connectedProfile.wallets.length > 1 && (
              <InfoRow label="WALLETS" value={`${connectedProfile.wallets.length} linked`} />
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[rgba(120,72,18,0.25)] px-4 py-2 flex items-center justify-between">
            <span className="font-mono text-[10px] text-zinc-600">
              {"enter portfolio · esc close"}
            </span>
          </div>
        </div>
      </div>,
      document.body,
    );
  }

  // Default: wallet selection screen
  let promptContent: React.ReactNode;
  if (error) {
    promptContent = (
      <span className="font-mono text-sm text-red-400">{`> ERR: ${error}`}</span>
    );
  } else if (isConnecting) {
    promptContent = (
      <>
        <span className="font-mono text-sm text-primary">{"> connect_wallet"}</span>
        <span className="font-mono text-sm text-primary ml-1">
          {SPINNER_FRAMES[spinnerFrame]}
        </span>
      </>
    );
  } else {
    promptContent = (
      <>
        <span className="font-mono text-sm text-primary">{"> connect_wallet"}</span>
        <span className="inline-block w-2 h-4 bg-primary ml-0.5 animate-[blink_1s_step-end_infinite]" />
      </>
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Palette */}
      <div
        className={cn(
          "relative mt-24 h-fit w-[420px] max-w-[calc(100vw-2rem)]",
          "border border-[rgba(120,72,18,0.55)]",
          "bg-[rgba(7,7,9,0.98)]",
          "shadow-[0_0_60px_rgba(247,147,26,0.08)]",
          "animate-fadeUp overflow-hidden",
        )}
      >
        {/* Grid background */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={GRID_STYLE}
        />

        {/* Pixel rain */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {PIXEL_STYLES.map((style, i) => (
            <span key={i} className="absolute" style={style} />
          ))}
        </div>

        {/* Terminal Prompt Line */}
        <div className="px-4 py-3 border-b border-[rgba(120,72,18,0.35)]">
          {promptContent}
        </div>

        {/* Wallet List */}
        <div className="p-2">
          {wallets.map((wallet, index) => {
            const isSelected = index === selectedIndex;
            const isWalletConnecting =
              isConnecting && connectingProvider === wallet.provider;

            return (
              <button
                key={wallet.provider}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2.5 font-mono text-sm transition-all",
                  isSelected
                    ? "bg-[rgba(247,147,26,0.08)] text-zinc-200"
                    : "text-zinc-500 hover:text-zinc-300",
                  !wallet.installed && "opacity-50 cursor-not-allowed",
                )}
                disabled={!wallet.installed}
                onClick={() => {
                  if (wallet.installed) {
                    setSelectedIndex(index);
                    onSelect(wallet.provider);
                  }
                }}
              >
                <span className="text-primary">
                  {isSelected ? ">" : "\u00A0"}
                </span>
                <span className="text-zinc-600 text-xs">[{index + 1}]</span>
                <span className="text-sm">
                  {wallet.provider}
                </span>
                <span className="ml-auto">
                  {isWalletConnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : wallet.installed ? (
                    <span className="h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                  ) : (
                    <span className="h-2.5 w-2.5 bg-zinc-700" />
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-[rgba(120,72,18,0.25)] px-4 py-2">
          <span className="font-mono text-[10px] text-zinc-600">
            {"↑↓ navigate · enter select · esc close"}
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-600">
        {label}
      </span>
      <span className="font-mono text-sm font-bold text-zinc-200">
        {value}
      </span>
    </div>
  );
}
