"use client";

import { useState } from "react";
import { Loader2, User } from "lucide-react";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import { type WalletProvider } from "@/lib/wallet-service";
import { type Profile } from "@/lib/auth-api";
import WalletBar from "@/components/wallet/WalletBar";
import WalletCommandPalette from "@/components/wallet/WalletCommandPalette";
import { truncateAddr } from "@/lib/utils";

export default function ProfilePage() {
  const {
    profile,
    wallets,
    isConnected,
    connect,
    connectAnother,
    removeWallet,
    disconnect,
    isConnecting,
    error,
  } = useWalletConnect();

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [connectingProvider, setConnectingProvider] =
    useState<WalletProvider | null>(null);
  const [connectedProfile, setConnectedProfile] = useState<Profile | null>(null);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);

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

  const handleDisconnect = async () => {
    await disconnect();
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
              />
            </div>
          </div>

          {/* Account Info */}
          <div className="br-card p-3 md:p-5">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center border border-[rgba(120,72,18,0.4)] bg-[rgba(247,147,26,0.08)]">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-mono text-sm font-bold uppercase tracking-[0.1em] text-zinc-200">
                    Account
                  </h2>
                  <p className="font-mono text-[10px] text-zinc-500">
                    Manage your profile and connected wallets
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {/* Primary Address */}
                <div className="border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                    Primary Address
                  </p>
                  <p className="mt-1 font-mono text-xs text-zinc-300">
                    {profile?.primaryAddress
                      ? truncateAddr(profile.primaryAddress, 10, 6)
                      : "—"}
                  </p>
                </div>

                {/* Profile ID */}
                <div className="border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                    Profile ID
                  </p>
                  <p className="mt-1 font-mono text-xs text-zinc-300">
                    {profile?.id
                      ? `${profile.id.slice(0, 8)}…${profile.id.slice(-8)}`
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Disconnect Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="border border-red-900/50 bg-red-950/20 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-red-400 transition-colors hover:bg-red-950/30"
                >
                  Disconnect All
                </button>
              </div>
            </div>
          </div>

          {/* Wallet Management */}
          <div className="br-card p-3 md:p-5">
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="font-mono text-sm font-bold uppercase tracking-[0.1em] text-zinc-200">
                  Connected Wallets
                </h2>
                <p className="font-mono text-[10px] text-zinc-500">
                  {wallets.length} wallet{wallets.length !== 1 ? "s" : ""}{" "}
                  linked to your profile
                </p>
              </div>

              <div className="grid gap-2">
                {wallets.map((wallet) => (
                  <div
                    key={wallet.ordinalsAddress}
                    className="flex items-center justify-between border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="h-1.5 w-1.5 bg-primary" />
                      <div>
                        <p className="font-mono text-xs font-bold text-zinc-300">
                          {wallet.label}
                        </p>
                        <p className="font-mono text-[10px] text-zinc-500">
                          {truncateAddr(wallet.ordinalsAddress, 10, 6)}
                        </p>
                      </div>
                    </div>
                    <div className="font-mono text-[10px] text-zinc-600">
                      Linked {new Date(wallet.linkedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>

              {wallets.length === 0 && (
                <div className="border border-dashed border-[rgba(120,72,18,0.35)] p-6 text-center">
                  <p className="font-mono text-xs text-zinc-500">
                    No wallets connected
                  </p>
                </div>
              )}
            </div>
          </div>
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
