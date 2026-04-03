"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { detectWallets, type WalletProvider } from "@/lib/wallet-service";

const WALLET_ICONS: Record<WalletProvider, React.ReactNode> = {
  xverse: (
    <svg viewBox="0 0 40 40" className="h-10 w-10" fill="none">
      <rect width="40" height="40" rx="8" fill="#1A1A2E" />
      <path d="M12 28L20 12L28 28" stroke="#EE7A30" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 22H25" stroke="#EE7A30" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
  unisat: (
    <svg viewBox="0 0 40 40" className="h-10 w-10" fill="none">
      <rect width="40" height="40" rx="8" fill="#1A1A2E" />
      <path d="M14 26C14 26 16 18 20 18C24 18 26 26 26 26" stroke="#F7931A" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="20" cy="14" r="2.5" fill="#F7931A" />
    </svg>
  ),
};

interface WalletConnectDropdownProps {
  open: boolean;
  onClose: () => void;
  onSelect: (provider: WalletProvider) => void;
  isConnecting: boolean;
  connectingProvider: WalletProvider | null;
  error: string | null;
}

export default function WalletConnectDropdown({
  open,
  onClose,
  onSelect,
  isConnecting,
  connectingProvider,
  error,
}: WalletConnectDropdownProps) {
  const [wallets, setWallets] = useState(detectWallets);

  useEffect(() => {
    if (open) setWallets(detectWallets());
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="absolute right-0 top-full z-50 mt-2 w-80 animate-fadeUp border border-[rgba(120,72,18,0.55)] bg-[rgba(7,7,9,0.98)] shadow-2xl">
      {/* Header */}
      <div className="border-b border-[rgba(120,72,18,0.35)] px-4 py-2.5">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
          Select Provider
        </span>
      </div>

      {/* Wallet List */}
      <div className="flex flex-col gap-2.5 p-4">
        {wallets.map((w) => {
          const isThisConnecting =
            isConnecting && connectingProvider === w.provider;

          return (
            <button
              key={w.provider}
              type="button"
              onClick={() => w.installed && onSelect(w.provider)}
              disabled={!w.installed || isConnecting}
              className="group flex items-center gap-4 border border-[rgba(120,72,18,0.35)] bg-[rgba(247,147,26,0.03)] px-4 py-3.5 transition-all hover:border-[rgba(120,72,18,0.6)] hover:bg-[rgba(247,147,26,0.08)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-[rgba(120,72,18,0.35)] disabled:hover:bg-[rgba(247,147,26,0.03)]"
            >
              {/* Icon */}
              <div className="flex-shrink-0">{WALLET_ICONS[w.provider]}</div>

              {/* Name */}
              <span className="flex-1 text-left font-mono text-sm font-bold tracking-[0.08em] text-zinc-200 group-disabled:text-zinc-500">
                {w.name}
              </span>

              {/* Status */}
              {isThisConnecting ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : w.installed ? (
                <span className="h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
              ) : (
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                  Not installed
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="border-t border-[rgba(120,72,18,0.35)] px-4 py-2">
          <p className="font-mono text-[10px] text-red-400">{error}</p>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-[rgba(120,72,18,0.25)] px-4 py-2.5">
        <p className="text-center font-mono text-[10px] text-zinc-600">
          By connecting, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}
