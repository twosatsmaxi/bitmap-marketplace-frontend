"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";
import { detectWallets, type WalletProvider } from "@/lib/wallet-service";

interface WalletBottomSheetProps {
  open: boolean;
  onClose: () => void;
  onSelect: (provider: WalletProvider) => void;
  isConnecting: boolean;
  connectingProvider: WalletProvider | null;
  error: string | null;
}

const WALLET_ICONS: Record<WalletProvider, React.ReactNode> = {
  xverse: (
    <svg viewBox="0 0 40 40" className="h-10 w-10" fill="none">
      <rect width="40" height="40" rx="8" fill="#1A1A2E" />
      <path
        d="M12 28L20 12L28 28"
        stroke="#EE7A30"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 22H25"
        stroke="#EE7A30"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  unisat: (
    <svg viewBox="0 0 40 40" className="h-10 w-10" fill="none">
      <rect width="40" height="40" rx="8" fill="#1A1A2E" />
      <path
        d="M14 26C14 26 16 18 20 18C24 18 26 26 26 26"
        stroke="#F7931A"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="20" cy="14" r="2.5" fill="#F7931A" />
    </svg>
  ),
};

export default function WalletBottomSheet({
  open,
  onClose,
  onSelect,
  isConnecting,
  connectingProvider,
  error,
}: WalletBottomSheetProps) {
  const [wallets, setWallets] = useState(() => detectWallets());

  useEffect(() => {
    if (open) {
      setWallets(detectWallets());
    }
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop scrim */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Sheet panel */}
      <div
        className="absolute bottom-0 left-0 right-0 mx-auto max-w-md animate-fadeUp border-t border-[rgba(120,72,18,0.55)] bg-[rgba(7,7,9,0.98)] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-out pb-[env(safe-area-inset-bottom)]"
      >
        {/* Grab handle */}
        <div className="flex justify-center py-3">
          <div className="flex items-center gap-1">
            <span className="h-1 w-1 bg-primary" />
            <span className="h-1 w-1 bg-primary" />
            <span className="h-1 w-1 bg-primary" />
          </div>
        </div>

        {/* Header */}
        <div className="px-5 pb-3">
          <h2 className="font-mono text-sm font-black uppercase tracking-[0.14em] text-primary">
            CONNECT WALLET
          </h2>
        </div>

        {/* Wallet list */}
        <div className="flex flex-col gap-2.5 px-5 pb-4">
          {wallets.map((wallet) => (
            <button
              key={wallet.provider}
              onClick={() => onSelect(wallet.provider)}
              disabled={isConnecting}
              className="group flex items-center gap-4 border border-[rgba(120,72,18,0.35)] bg-[rgba(247,147,26,0.03)] px-4 py-4 transition-all hover:border-[rgba(120,72,18,0.6)] hover:bg-[rgba(247,147,26,0.08)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-[rgba(120,72,18,0.35)] disabled:hover:bg-[rgba(247,147,26,0.03)]"
            >
              {WALLET_ICONS[wallet.provider]}
              <span className="flex-1 text-left font-mono text-sm font-bold tracking-[0.08em] text-zinc-200 group-disabled:text-zinc-500">
                {wallet.name}
              </span>
              {connectingProvider === wallet.provider ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : wallet.installed ? (
                <span className="h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
              ) : (
                <span className="font-mono text-[10px] text-zinc-500">
                  Not installed
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Error section */}
        {error && (
          <div className="mx-5 border-t border-[rgba(120,72,18,0.35)] px-0 py-3">
            <p className="font-mono text-[10px] text-red-400">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-[rgba(120,72,18,0.25)] px-5 py-3">
          <p className="text-center font-mono text-[10px] text-zinc-600">
            By connecting, you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
