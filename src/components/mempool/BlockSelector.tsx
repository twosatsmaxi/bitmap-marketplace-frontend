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
    <div className="absolute left-1/2 -translate-x-1/2 z-10" style={{ top: "calc(var(--header-total) + 1rem)" }}>
      {/* Title row */}
      <div className="flex items-center justify-center gap-3">
        <div
          className="cursor-pointer text-center"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="font-mono text-2xl font-bold text-primary">
            {currentHeight.toLocaleString()}
          </span>
          <span className="font-mono text-2xl font-bold text-zinc-600">.bitmap</span>
        </div>

        {txCount != null && (
          <>
            <div className="h-5 w-px bg-[rgba(255,255,255,0.12)]" />
            <span className="font-mono text-xs text-zinc-500">
              {txCount.toLocaleString()} <span className="text-[10px] uppercase tracking-[0.1em]">txns</span>
            </span>
          </>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded",
            "border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)]",
            "text-zinc-500 hover:text-zinc-300 hover:border-[rgba(247,162,59,0.5)]",
            "transition-colors active:scale-95"
          )}
          aria-label="Search block"
        >
          <Search className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Search dropdown */}
      {isOpen && (
        <div className="mt-2 flex justify-center">
          <form onSubmit={handleSubmit}>
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-zinc-600" />
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Enter block height..."
                value={value}
                onChange={(e) => {
                  if (/^\d*$/.test(e.target.value)) setValue(e.target.value);
                }}
                disabled={disabled}
                autoFocus
                className={cn(
                  "w-48 rounded border border-[rgba(255,255,255,0.15)] bg-[rgba(9,9,11,0.9)] backdrop-blur-sm py-2 pl-8 pr-10",
                  "font-mono text-xs text-zinc-200 placeholder-zinc-600 outline-none",
                  "focus:border-[rgba(255,255,255,0.25)] focus:bg-[rgba(9,9,11,0.95)]",
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
        </div>
      )}
    </div>
  );
}
