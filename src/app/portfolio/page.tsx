"use client";

import { useMemo } from "react";
import { Wallet, Loader2 } from "lucide-react";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import { isWalletAvailable } from "@/lib/wallet-service";
import WalletBar from "@/components/wallet/WalletBar";
import MultiWalletPortfolioGrid from "@/components/portfolio/MultiWalletPortfolioGrid";

export default function PortfolioPage() {
  const {
    wallets,
    isConnected,
    connect,
    connectAnother,
    removeWallet,
    isConnecting,
  } = useWalletConnect();

  const addresses = useMemo(
    () => wallets.map((w) => w.ordinalsAddress),
    [wallets]
  );

  if (!isConnected) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center gap-6 px-3 pb-12 pt-16 md:px-4 md:pt-24">
        <div className="br-card flex flex-col items-center gap-5 p-8 md:p-12">
          <div className="flex h-16 w-16 items-center justify-center border border-[rgba(120,72,18,0.4)] bg-[rgba(247,147,26,0.06)]">
            <Wallet className="h-7 w-7 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="font-mono text-lg font-black uppercase tracking-[0.1em] text-primary md:text-2xl">
              Bitmap Portfolio
            </h1>
            <p className="mt-2 max-w-sm font-mono text-xs text-zinc-500">
              Connect your Xverse wallet to view your bitmaps. You can link
              multiple wallets to see an aggregated portfolio.
            </p>
          </div>
          {isWalletAvailable() ? (
            <button
              type="button"
              onClick={connect}
              disabled={isConnecting}
              className="flex items-center gap-2 border border-primary bg-[rgba(247,147,26,0.12)] px-6 py-3 font-mono text-xs font-bold uppercase tracking-[0.18em] text-primary transition-colors hover:bg-[rgba(247,147,26,0.2)] disabled:opacity-50"
            >
              {isConnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wallet className="h-4 w-4" />
              )}
              {isConnecting ? "Connecting..." : "Connect Xverse"}
            </button>
          ) : (
            <p className="font-mono text-xs text-zinc-500">
              No Bitcoin wallet detected. Please install the{" "}
              <span className="text-primary">Xverse</span> extension.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-3 pb-12 pt-3 md:gap-4 md:px-4 md:pt-4">
      {/* Header */}
      <div className="br-card p-3 md:p-5">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-lg font-black uppercase tracking-[0.1em] text-primary md:text-2xl">
              Bitmap Portfolio
            </h1>
            <span className="border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.035)] rounded px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-400 md:text-[10px]">
              {wallets.length} wallet{wallets.length !== 1 ? "s" : ""}
            </span>
          </div>
          <WalletBar
            wallets={wallets}
            onRemove={removeWallet}
            onConnectAnother={connectAnother}
          />
        </div>
      </div>

      {/* Grid */}
      <MultiWalletPortfolioGrid addresses={addresses} />
    </div>
  );
}
