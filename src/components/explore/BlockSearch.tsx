"use client";

import { useState, FormEvent } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface BlockSearchProps {
  onSearch: (height: number) => void;
  disabled?: boolean;
}

export default function BlockSearch({ onSearch, disabled }: BlockSearchProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0 || num > 1_000_000) {
      setError("Pick a block between 0 and 1,000,000");
      return;
    }
    setError("");
    onSearch(num);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1">
      <div className="flex">
        {/* Input */}
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-zinc-600" />
          <input
            type="text"
            inputMode="numeric"
            placeholder="Jump to block…"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError("");
            }}
            disabled={disabled}
            className={cn(
              "w-44 rounded-l border border-r-0 border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.07)] py-2 pl-8 pr-3",
              "font-mono text-xs text-zinc-200 placeholder-zinc-600 outline-none",
              "focus:border-[rgba(255,255,255,0.25)] focus:bg-[rgba(255,255,255,0.09)]",
              "disabled:opacity-50"
            )}
          />
        </div>

        {/* Go button */}
        <button
          type="submit"
          disabled={disabled}
          className={cn(
            "rounded-r border border-[rgba(247,162,59,0.45)] bg-[rgba(247,162,59,0.18)] px-3 py-2",
            "font-mono text-xs font-bold uppercase tracking-[0.18em] text-primary",
            "transition-colors hover:bg-[rgba(247,162,59,0.28)]",
            "disabled:opacity-50"
          )}
        >
          Go
        </button>
      </div>

      {error && (
        <span className="font-mono text-[10px] text-red-500/80">{error}</span>
      )}
    </form>
  );
}
