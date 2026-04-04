"use client";

import { useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import { type WalletProvider } from "@/lib/wallet-service";
import { type Profile } from "@/lib/auth-api";
import WalletBar from "@/components/wallet/WalletBar";
import WalletCommandPalette from "@/components/wallet/WalletCommandPalette";
import MultiWalletPortfolioGrid from "@/components/portfolio/MultiWalletPortfolioGrid";

export default function ProfilePage() {
  const {
    wallets,
    isConnected,
    connect,
    connectAnother,
    removeWallet,
    isConnecting,
    error,
  } = useWalletConnect();

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [connectingProvider, setConnectingProvider] =
    useState<WalletProvider | null>(null);
  const [connectedProfile, setConnectedProfile] = useState<Profile | null>(null);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [activeWallet, setActiveWallet] = useState<string | null>(null);

  const addresses = useMemo(
    () => wallets.map((w) => w.ordinalsAddress),
    [wallets]
  );

  const handleWalletSelect = async (provider: WalletProvider) => {
    setConnectingProvider(provider);
    const result = isConnected
      ? await connectAnother(provider)
      : await connect(provider);
    if (result) {
      setConnectedProfile(result.profile);
      setConnectedAddress(result.ordinalsAddress);
    }
  };

  const handlePaletteClose = () => {
    setPaletteOpen(false);
    setConnectedProfile(null);
    setConnectingProvider(null);
    setConnectedAddress(null);
  };

  return (
    <>
      {!isConnected ? (
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center gap-6 px-3 pb-12 pt-16 md:px-4 md:pt-24">
          <div className="br-card flex flex-col items-center gap-5 p-8 md:p-12">
            <div className="text-center">
              <h1 className="font-mono text-lg font-black uppercase tracking-[0.1em] text-primary md:text-2xl">
                Profile
              </h1>
              <p className="mt-2 max-w-sm font-mono text-xs text-zinc-500">
                Connect your wallet to view your profile. Manage your connected
                wallets and account settings.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              disabled={isConnecting}
              className="flex items-center gap-2 border border-primary bg-[rgba(247,147,26,0.12)] px-6 py-3 font-mono text-xs font-bold uppercase tracking-[0.18em] text-primary transition-colors hover:bg-[rgba(247,147,26,0.2)] disabled:opacity-50"
            >
              {isConnecting && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-3 pb-12 pt-3 md:gap-4 md:px-4 md:pt-4">
          {/* Header */}
          <div className="br-card p-3 md:p-5">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <h1 className="font-mono text-lg font-black uppercase tracking-[0.1em] text-primary md:text-2xl">
                  Profile
                </h1>
                <span className="border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.035)] rounded px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-400 md:text-[10px]">
                  {wallets.length} wallet{wallets.length !== 1 ? "s" : ""}
                </span>
              </div>
              <WalletBar
                wallets={wallets}
                onRemove={removeWallet}
                onConnectAnother={() => setPaletteOpen(true)}
                activeAddress={activeWallet}
                onToggleFilter={(addr) =>
                  setActiveWallet((prev) => (prev === addr ? null : addr))
                }
              />
            </div>
          </div>

          {/* Bitmap Portfolio Grid */}
          <MultiWalletPortfolioGrid addresses={addresses} activeWallet={activeWallet} />
        </div>
      )}

      <WalletCommandPalette
        open={paletteOpen}
        onClose={handlePaletteClose}
        onSelect={handleWalletSelect}
        isConnecting={isConnecting}
        connectingProvider={connectingProvider}
        connectedProfile={connectedProfile}
        connectedAddress={connectedAddress}
        onGoToProfile={handlePaletteClose}
        error={error}
      />
    </>
  );
}
