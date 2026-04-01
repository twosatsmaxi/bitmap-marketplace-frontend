"use client";

import { useState, useRef, useEffect } from "react";
import { Wallet, X, Plus, LogOut, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { truncateAddr } from "@/lib/utils";
import { isWalletAvailable } from "@/lib/wallet-service";
import { useWalletConnect } from "@/hooks/useWalletConnect";

export default function WalletDropdown() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    wallets,
    isConnected,
    connect,
    connectAnother,
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
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleConnect = async () => {
    await connect();
    setOpen(false);
  };

  const handleConnectAnother = async () => {
    await connectAnother();
  };

  const handleDisconnect = async () => {
    await disconnect();
    setOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "hidden items-center gap-2 border px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.18em] transition-colors md:inline-flex",
          isConnected
            ? "border-[rgba(120,72,18,0.55)] bg-[rgba(247,147,26,0.08)] text-primary hover:bg-[rgba(247,147,26,0.14)]"
            : "border-[rgba(120,72,18,0.4)] text-zinc-400 hover:border-[rgba(120,72,18,0.55)] hover:text-primary"
        )}
      >
        <Wallet className="h-3.5 w-3.5" />
        {isConnected
          ? truncateAddr(wallets[0]?.ordinalsAddress ?? "", 6, 4)
          : "Connect"}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 border border-[rgba(120,72,18,0.55)] bg-[rgba(7,7,9,0.98)] shadow-2xl backdrop-blur-md">
          {!isConnected ? (
            /* Not connected */
            <div className="p-4">
              {!isWalletAvailable() ? (
                <p className="font-mono text-xs text-zinc-500">
                  No Bitcoin wallet detected.
                  <br />
                  Please install the Xverse extension.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="flex w-full items-center justify-center gap-2 border border-primary bg-[rgba(247,147,26,0.12)] px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.18em] text-primary transition-colors hover:bg-[rgba(247,147,26,0.2)] disabled:opacity-50"
                >
                  {isConnecting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Wallet className="h-3.5 w-3.5" />
                  )}
                  {isConnecting ? "Connecting..." : "Connect Xverse"}
                </button>
              )}
              {error && (
                <p className="mt-2 font-mono text-[10px] text-red-400">
                  {error}
                </p>
              )}
            </div>
          ) : (
            /* Connected — wallet list */
            <>
              <div className="border-b border-[rgba(120,72,18,0.35)] px-4 py-2.5">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                  Linked Wallets
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto">
                {wallets.map((w) => (
                  <div
                    key={w.ordinalsAddress}
                    className="group flex items-center gap-2 px-4 py-2.5 transition-colors hover:bg-[rgba(247,147,26,0.04)]"
                  >
                    <span className="h-1.5 w-1.5 flex-shrink-0 bg-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[11px] font-bold text-zinc-300">
                        {w.label}
                      </p>
                      <p className="truncate font-mono text-[10px] text-zinc-500">
                        {truncateAddr(w.ordinalsAddress, 8, 6)}
                      </p>
                    </div>
                    {wallets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeWallet(w.ordinalsAddress)}
                        className="flex-shrink-0 text-zinc-600 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
                        aria-label={`Remove ${w.label}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t border-[rgba(120,72,18,0.35)] p-2">
                <button
                  type="button"
                  onClick={handleConnectAnother}
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
                  Disconnect All
                </button>
              </div>

              {error && (
                <div className="border-t border-[rgba(120,72,18,0.35)] px-4 py-2">
                  <p className="font-mono text-[10px] text-red-400">{error}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
