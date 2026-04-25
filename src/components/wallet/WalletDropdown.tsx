"use client";

import { useState, useRef, useEffect } from "react";
import { Wallet, X, Plus, LogOut, Loader2, User, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn, truncateAddr } from "@/lib/utils";
import { useWalletConnect } from "@/hooks/useWalletConnect";

interface WalletDropdownProps {
  onOpenPalette: () => void;
}

export default function WalletDropdown({ onOpenPalette }: WalletDropdownProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState<string | null>(null);
  const [walletsExpanded, setWalletsExpanded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    wallets,
    isConnected,
    removeWallet,
    disconnect,
    isConnecting,
    error,
  } = useWalletConnect();
  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setConfirmingRemove(null);
        setWalletsExpanded(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleDisconnect = async () => {
    await disconnect();
    setConfirmingRemove(null);
    setOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => {
          if (isConnected) {
            setOpen((o) => !o);
          } else {
            onOpenPalette();
          }
        }}
        className={cn(
          "relative hidden items-center gap-2 border px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.18em] transition-colors md:inline-flex",
          isConnected
            ? "border-[rgba(120,72,18,0.55)] bg-[rgba(247,147,26,0.08)] text-primary hover:bg-[rgba(247,147,26,0.14)]"
            : "animate-pulseGlow border-primary bg-primary text-bg shadow-glow hover:bg-[rgba(247,147,26,0.88)]"
        )}
      >
        <Wallet className="h-3.5 w-3.5" />
        {isConnected
          ? truncateAddr(wallets[0]?.ordinalsAddress ?? "", 6, 4)
          : "Connect"}
      </button>

      {/* Connected dropdown (when connected) */}
      {open && isConnected && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 border border-[rgba(120,72,18,0.55)] bg-[rgba(7,7,9,0.98)] shadow-2xl backdrop-blur-md">
          {/* Active wallet */}
          <div className="border-b border-[rgba(120,72,18,0.35)] px-4 py-3">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
              Active Wallet
            </span>
            {wallets[0] && (
              <div className="mt-1.5 flex items-center gap-2">
                <span className="h-1.5 w-1.5 flex-shrink-0 bg-primary" />
                <p className="font-mono text-[11px] font-bold text-primary">
                  {wallets[0].label}: {truncateAddr(wallets[0].ordinalsAddress, 8, 6)}
                </p>
              </div>
            )}
          </div>

          {/* Linked wallets — collapsible */}
          {wallets.length > 1 && (
            <div className="border-b border-[rgba(120,72,18,0.35)]">
              <button
                type="button"
                onClick={() => setWalletsExpanded((v) => !v)}
                className="flex w-full items-center gap-2 px-4 py-2.5 transition-colors hover:bg-[rgba(247,147,26,0.04)]"
              >
                <ChevronRight
                  className={cn(
                    "h-3 w-3 text-zinc-500 transition-transform",
                    walletsExpanded && "rotate-90"
                  )}
                />
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                  Linked Wallets ({wallets.length - 1})
                </span>
              </button>

              {walletsExpanded && (
                <div className="max-h-36 overflow-y-auto pb-1">
                  {wallets.slice(1).map((w) => (
                    <div
                      key={w.ordinalsAddress}
                      className="group flex items-center gap-2 px-4 py-2 transition-colors hover:bg-[rgba(247,147,26,0.04)]"
                    >
                      <span className="h-1.5 w-1.5 flex-shrink-0 bg-primary/60" />
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-[11px] font-bold text-zinc-400">
                          {w.label}: {truncateAddr(w.ordinalsAddress, 8, 6)}
                        </p>
                      </div>
                      {confirmingRemove === w.ordinalsAddress ? (
                        <span className="flex items-center gap-1 font-mono text-[10px]">
                          <button
                            type="button"
                            onClick={() => {
                              removeWallet(w.ordinalsAddress);
                              setConfirmingRemove(null);
                            }}
                            className="font-bold text-red-400 hover:text-red-300"
                          >
                            Remove?
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingRemove(null)}
                            className="text-zinc-500 hover:text-zinc-300"
                          >
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmingRemove(w.ordinalsAddress)}
                          className="flex-shrink-0 text-zinc-600 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
                          aria-label={`Remove ${w.label}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="border-t border-[rgba(120,72,18,0.35)] p-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push("/profile");
              }}
              className="flex w-full items-center gap-2 px-2 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400 transition-colors hover:text-primary"
            >
              <User className="h-3 w-3" />
              Profile
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onOpenPalette();
              }}
              disabled={isConnecting}
              className="flex w-full items-center gap-2 px-2 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400 transition-colors hover:text-primary disabled:opacity-50"
            >
              {isConnecting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Plus className="h-3 w-3" />
              )}
              Connect Another
            </button>
            <button
              type="button"
              onClick={handleDisconnect}
              className="flex w-full items-center gap-2 px-2 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500 transition-colors hover:text-red-400"
            >
              <LogOut className="h-3 w-3" />
              Logout
            </button>
          </div>

          {error && (
            <div className="border-t border-[rgba(120,72,18,0.35)] px-4 py-2">
              <p className="font-mono text-[10px] text-red-400">{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
