"use client";

import Link from "next/link";
import { Plus, X } from "lucide-react";
import { truncateAddr } from "@/lib/utils";
import type { ProfileWallet } from "@/lib/auth-api";

interface WalletBarProps {
  wallets: ProfileWallet[];
  onRemove: (ordinalsAddress: string) => void;
  onConnectAnother: () => void;
}

export default function WalletBar({
  wallets,
  onRemove,
  onConnectAnother,
}: WalletBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {wallets.map((w) => (
        <div
          key={w.ordinalsAddress}
          className="group flex items-center gap-1.5 border border-[rgba(120,72,18,0.4)] bg-[rgba(247,147,26,0.04)] px-2.5 py-1.5 transition-colors hover:border-[rgba(120,72,18,0.6)]"
        >
          <span className="h-1.5 w-1.5 flex-shrink-0 bg-primary" />
          <Link
            href={`/portfolio/${w.ordinalsAddress}`}
            className="font-mono text-[11px] text-zinc-300 transition-colors hover:text-primary"
          >
            <span className="font-bold text-zinc-400">{w.label}:</span>{" "}
            {truncateAddr(w.ordinalsAddress, 6, 4)}
          </Link>
          {wallets.length > 1 && (
            <button
              type="button"
              onClick={() => onRemove(w.ordinalsAddress)}
              className="ml-0.5 flex-shrink-0 text-zinc-600 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
              aria-label={`Remove ${w.label}`}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={onConnectAnother}
        className="flex items-center gap-1 border border-dashed border-[rgba(120,72,18,0.35)] px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500 transition-colors hover:border-[rgba(120,72,18,0.55)] hover:text-primary"
      >
        <Plus className="h-3 w-3" />
        Add Wallet
      </button>
    </div>
  );
}
