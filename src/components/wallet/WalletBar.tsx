"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditableWalletLabel } from "@/components/profile/EditableWalletLabel";
import type { ProfileWallet } from "@/lib/auth-api";

interface WalletBarProps {
  wallets: ProfileWallet[];
  onRemove: (ordinalsAddress: string) => void;
  onConnectAnother: () => void;
  onLabelChange?: (ordinalsAddress: string, newLabel: string) => void;
  activeAddress?: string | null;
  onToggleFilter?: (ordinalsAddress: string) => void;
}

export default function WalletBar({
  wallets,
  onRemove,
  onConnectAnother,
  onLabelChange,
  activeAddress,
  onToggleFilter,
}: WalletBarProps) {
  const [confirmingRemove, setConfirmingRemove] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {wallets.map((w) => {
        const isActive = activeAddress === w.ordinalsAddress;
        return (
          <div
            key={w.ordinalsAddress}
            className={cn(
              "group flex items-center gap-1.5 border px-2.5 py-1.5 transition-colors",
              isActive
                ? "border-primary bg-[rgba(247,147,26,0.12)]"
                : "border-[rgba(120,72,18,0.4)] bg-[rgba(247,147,26,0.04)] hover:border-[rgba(120,72,18,0.6)]"
            )}
          >
            <span className={cn(
              "h-1.5 w-1.5 flex-shrink-0",
              isActive ? "bg-primary" : "bg-primary/60"
            )} />
            <EditableWalletLabel
              address={w.ordinalsAddress}
              label={w.label}
              isActive={isActive}
              onLabelChange={(newLabel) => onLabelChange?.(w.ordinalsAddress, newLabel)}
              onToggleFilter={() => onToggleFilter?.(w.ordinalsAddress)}
            />
            {wallets.length > 1 && (
              confirmingRemove === w.ordinalsAddress ? (
                <span className="ml-0.5 flex items-center gap-1 font-mono text-[10px]">
                  <button
                    type="button"
                    onClick={() => {
                      onRemove(w.ordinalsAddress);
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
                  className="ml-0.5 flex-shrink-0 text-zinc-600 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
                  aria-label={`Remove ${w.label}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )
            )}
          </div>
        );
      })}
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
