"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2 } from "lucide-react";
import { detectWallets, type WalletProvider } from "@/lib/wallet-service";
import { WALLET_ICONS } from "./wallet-icons";

interface WalletConnectModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (provider: WalletProvider) => void;
  isConnecting: boolean;
  connectingProvider: WalletProvider | null;
  error: string | null;
}

export default function WalletConnectModal({
  open,
  onClose,
  onSelect,
  isConnecting,
  connectingProvider,
  error,
}: WalletConnectModalProps) {
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

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-[380px] max-w-[calc(100vw-2rem)] border border-[rgba(120,72,18,0.55)] bg-[rgba(7,7,9,0.98)] shadow-[0_0_60px_rgba(247,147,26,0.08)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(120,72,18,0.35)] px-5 py-4">
          <h2 className="font-mono text-sm font-black uppercase tracking-[0.14em] text-primary">
            Connect Wallet
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center text-zinc-500 transition-colors hover:text-zinc-300"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Wallet List */}
        <div className="flex flex-col gap-2.5 p-5">
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
          <div className="border-t border-[rgba(120,72,18,0.35)] px-5 py-3">
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
