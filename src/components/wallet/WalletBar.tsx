"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditableWalletLabel } from "@/components/profile/EditableWalletLabel";
import CollapsibleWalletPills from "@/components/wallet/CollapsibleWalletPills";
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
  const [lockedWidth, setLockedWidth] = useState<number | null>(null);
  const chipRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const confirmRef = useRef<HTMLDivElement>(null);

  const startConfirm = (address: string) => {
    const el = chipRefs.current.get(address);
    if (el) setLockedWidth(el.offsetWidth);
    setConfirmingRemove(address);
  };

  const cancelConfirm = () => {
    setConfirmingRemove(null);
    setLockedWidth(null);
  };

  useEffect(() => {
    if (!confirmingRemove) return;
    function handleClick(e: MouseEvent) {
      if (confirmRef.current && !confirmRef.current.contains(e.target as Node)) {
        cancelConfirm();
      }
    }
    document.addEventListener("pointerdown", handleClick);
    return () => document.removeEventListener("pointerdown", handleClick);
  }, [confirmingRemove]);

  return (
    <CollapsibleWalletPills
      items={wallets}
      getKey={(w) => w.ordinalsAddress}
      getSearchText={(w) => `${w.label ?? ""} ${w.ordinalsAddress}`}
      renderItem={(w) => {
        const isActive = activeAddress === w.ordinalsAddress;
        const isConfirming = confirmingRemove === w.ordinalsAddress;
        return (
          <div
            ref={(el) => {
              if (el) chipRefs.current.set(w.ordinalsAddress, el);
              if (isConfirming && el)
                (confirmRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
            }}
            style={isConfirming && lockedWidth ? { minWidth: lockedWidth } : undefined}
            className={cn(
              "group flex items-center gap-1.5 border px-2.5 py-1.5 transition-colors",
              isConfirming
                ? "border-red-500/50 bg-red-500/10"
                : isActive
                  ? "border-primary bg-[rgba(247,147,26,0.12)]"
                  : "border-[rgba(120,72,18,0.4)] bg-[rgba(247,147,26,0.04)] hover:border-[rgba(120,72,18,0.6)]"
            )}
          >
            {isConfirming ? (
              <button
                type="button"
                onClick={() => {
                  onRemove(w.ordinalsAddress);
                  cancelConfirm();
                }}
                className="w-full text-center font-mono text-[11px] font-bold text-red-400 transition-colors hover:text-red-300"
              >
                Remove?
              </button>
            ) : (
              <>
                <span className={cn("h-1.5 w-1.5 flex-shrink-0", isActive ? "bg-primary" : "bg-primary/60")} />
                <EditableWalletLabel
                  address={w.ordinalsAddress}
                  label={w.label}
                  isActive={isActive}
                  onLabelChange={(newLabel) => onLabelChange?.(w.ordinalsAddress, newLabel)}
                  onToggleFilter={() => onToggleFilter?.(w.ordinalsAddress)}
                />
                {wallets.length > 1 && (
                  <button
                    type="button"
                    onClick={() => startConfirm(w.ordinalsAddress)}
                    className="ml-0.5 flex-shrink-0 text-zinc-600 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
                    aria-label={`Remove ${w.label}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </>
            )}
          </div>
        );
      }}
      footer={
        <button
          type="button"
          onClick={onConnectAnother}
          className="flex items-center gap-1 border border-dashed border-[rgba(120,72,18,0.35)] px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500 transition-colors hover:border-[rgba(120,72,18,0.55)] hover:text-primary"
        >
          <Plus className="h-3 w-3" />
          Add Wallet
        </button>
      }
    />
  );
}
