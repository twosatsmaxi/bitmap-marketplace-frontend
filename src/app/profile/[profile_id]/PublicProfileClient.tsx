"use client";

import { useCallback, useState } from "react";
import { Link, Check } from "lucide-react";
import { cn, truncateAddr } from "@/lib/utils";
import CollapsibleWalletPills from "@/components/wallet/CollapsibleWalletPills";
import MultiWalletPortfolioGrid from "@/components/portfolio/MultiWalletPortfolioGrid";

interface PublicProfileClientProps {
  profileId: string;
}

export default function PublicProfileClient({ profileId }: PublicProfileClientProps) {
  const [bitmapCount, setBitmapCount] = useState(0);
  const [addresses, setAddresses] = useState<{ address: string; label: string | null }[]>([]);
  const [activeWallet, setActiveWallet] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const handleTotalChange = useCallback((t: number) => setBitmapCount(t), []);

  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/profile/${profileId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [profileId]);
  const handleAddressesChange = useCallback(
    (addrs: { address: string; label: string | null }[]) => setAddresses(addrs),
    []
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 md:gap-4 px-3 md:px-4 pb-12 pt-3 md:pt-4">
      {/* Header */}
      <div className="br-card p-3 md:p-5">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-lg font-black uppercase tracking-[0.1em] text-primary md:text-2xl">
              Profile
            </h1>
            {addresses.length > 0 && (
              <span className="border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.035)] rounded px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-400 md:text-[10px]">
                {addresses.length} wallet{addresses.length !== 1 ? "s" : ""}
              </span>
            )}
            {bitmapCount > 0 && (
              <span className="border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.035)] rounded px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-400 md:text-[10px]">
                <span className="text-primary">{bitmapCount}</span> bitmap{bitmapCount !== 1 ? "s" : ""}
              </span>
            )}
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1 rounded px-1.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500 transition-colors hover:text-primary md:text-[10px]"
              title="Copy profile link"
            >
              {copied ? <><Check className="h-3 w-3" /> Copied</> : <><Link className="h-3 w-3" /> Share</>}
            </button>
          </div>
          {/* Wallet pills */}
          {addresses.length > 1 && (
            <CollapsibleWalletPills
              items={addresses}
              getKey={(w) => w.address}
              getSearchText={(w) => `${w.label ?? ""} ${w.address}`}
              renderItem={(w) => {
                const isActive = activeWallet === w.address;
                return (
                  <button
                    type="button"
                    onClick={() => setActiveWallet((prev) => (prev === w.address ? null : w.address))}
                    className={cn(
                      "flex items-center gap-1.5 border px-2.5 py-1.5 transition-colors",
                      isActive
                        ? "border-primary bg-[rgba(247,147,26,0.12)] text-primary"
                        : "border-[rgba(120,72,18,0.4)] bg-[rgba(247,147,26,0.04)] text-zinc-400 hover:border-[rgba(120,72,18,0.6)] hover:text-zinc-300"
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 flex-shrink-0", isActive ? "bg-primary" : "bg-primary/60")} />
                    <span className="flex items-center gap-1.5 font-mono text-[11px]">
                      {w.label && (
                        <>
                          <span className={cn("font-bold truncate max-w-[120px]", isActive ? "text-primary" : "text-zinc-400")}>
                            {w.label}
                          </span>
                          <span className="text-zinc-600">&middot;</span>
                        </>
                      )}
                      <span className={isActive ? "text-primary/70" : "text-zinc-500"}>
                        {truncateAddr(w.address, 6, 4)}
                      </span>
                    </span>
                  </button>
                );
              }}
            />
          )}
        </div>
      </div>

      {/* Bitmap Portfolio Grid */}
      <MultiWalletPortfolioGrid
        profileId={profileId}
        activeWallet={activeWallet}
        onTotalChange={handleTotalChange}
        onAddressesChange={handleAddressesChange}
      />
    </div>
  );
}
