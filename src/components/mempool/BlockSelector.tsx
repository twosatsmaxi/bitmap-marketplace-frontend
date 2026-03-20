"use client";

import { useState, useCallback } from "react";
import { Search, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BlockSelectorProps {
  currentHeight: number;
  onHeightChange: (height: number) => void;
  txCount?: number;
  disabled?: boolean;
}

export function BlockSelector({ currentHeight, onHeightChange, txCount, disabled }: BlockSelectorProps) {
  const [value, setValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const height = parseInt(value, 10);
    if (!isNaN(height) && height > 0) {
      onHeightChange(height);
      setIsOpen(false);
      setValue("");
    }
  }, [value, onHeightChange]);

  return (
    <div className="absolute left-6 z-10" style={{ top: "calc(var(--header-total) + 1rem)" }}>
      <div className="br-card p-3">
        <div className="flex items-start gap-4">
          <div
            className="cursor-pointer"
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="font-mono text-xl font-bold text-primary">
              {currentHeight.toLocaleString()}<span className="text-zinc-500">.bitmap</span>
            </div>
          </div>
          {txCount != null && (
            <div className="border-l border-[rgba(255,255,255,0.08)] pl-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                Transactions
              </div>
              <div className="font-mono text-xl font-bold text-white">
                {txCount.toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {isOpen && (
          <form onSubmit={handleSubmit} className="mt-3">
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-zinc-600" />
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Enter height..."
                value={value}
                onChange={(e) => {
                  if (/^\d*$/.test(e.target.value)) setValue(e.target.value);
                }}
                disabled={disabled}
                autoFocus
                className={cn(
                  "w-full rounded border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.07)] py-2 pl-8 pr-10",
                  "font-mono text-xs text-zinc-200 placeholder-zinc-600 outline-none",
                  "focus:border-[rgba(255,255,255,0.25)] focus:bg-[rgba(255,255,255,0.09)]",
                  "disabled:opacity-50"
                )}
              />
              <button
                type="submit"
                disabled={disabled || !value}
                className={cn(
                  "absolute right-1.5 flex h-6 w-6 items-center justify-center rounded",
                  "bg-[rgba(247,162,59,0.9)] text-black transition-all",
                  "hover:bg-[rgba(247,162,59,1)] active:scale-95",
                  "disabled:opacity-0 disabled:pointer-events-none"
                )}
                aria-label="Go to block"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        )}

        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="mt-2 flex w-full items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500 hover:text-zinc-300 transition-colors active:scale-95"
          >
            <Search className="h-3 w-3" />
            Search
          </button>
        )}
      </div>
    </div>
  );
}
