"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import { listEntries, selectWinner } from "@/lib/giveaway-api";
import type { GiveawayEntry } from "@/lib/types";
import { truncateAddr } from "@/lib/utils";

interface WinnerSelectorProps {
  giveawayId: string;
  onWinnerSelected?: () => void;
}

export default function WinnerSelector({ giveawayId, onWinnerSelected }: WinnerSelectorProps) {
  const [entries, setEntries] = useState<GiveawayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listEntries(giveawayId);
        if (!cancelled) setEntries(data.entries);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load entries");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [giveawayId]);

  const handleSelect = async () => {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      await selectWinner(giveawayId, selected);
      onWinnerSelected?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to select winner");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRandomPick = () => {
    if (entries.length === 0) return;
    const idx = Math.floor(Math.random() * entries.length);
    setSelected(entries[idx].wallet_address);
  };

  if (loading) {
    return (
      <div className="border border-[rgba(120,72,18,0.55)] bg-[rgba(10,10,12,0.92)] p-4">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-zinc-500 animate-pulse">
          Loading entries...
        </p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="border border-[rgba(120,72,18,0.55)] bg-[rgba(10,10,12,0.92)] p-4">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-zinc-500">
          No entries yet
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 border border-[rgba(120,72,18,0.55)] bg-[rgba(10,10,12,0.92)] p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
          Select Winner ({entries.length} entries)
        </span>
        <Button variant="ghost" size="sm" onClick={handleRandomPick}>
          Random Pick
        </Button>
      </div>

      <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
        {entries.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setSelected(entry.wallet_address)}
            className={`flex items-center gap-2 px-3 py-2 font-mono text-xs transition-colors ${
              selected === entry.wallet_address
                ? "border border-primary bg-primary/10 text-primary"
                : "border border-transparent text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300"
            }`}
          >
            <span className={`h-1.5 w-1.5 flex-shrink-0 ${
              selected === entry.wallet_address ? "bg-primary" : "bg-zinc-600"
            }`} />
            {truncateAddr(entry.wallet_address, 10, 8)}
          </button>
        ))}
      </div>

      {error && (
        <p className="font-mono text-[10px] text-red-400">{error}</p>
      )}

      <Button
        variant="primary"
        size="md"
        loading={submitting}
        disabled={!selected}
        onClick={handleSelect}
        className="w-full"
      >
        Confirm Winner
      </Button>
    </div>
  );
}
