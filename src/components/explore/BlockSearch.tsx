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
      setError("Enter a block height between 0 and 1,000,000");
      return;
    }
    setError("");
    onSearch(num);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1">
      <div className="flex">
        {/* Left icon border */}
        <div className="flex items-center border border-r-0 border-[rgba(120,72,18,0.55)] bg-[rgba(247,147,26,0.04)] px-2.5 text-zinc-600">
          <Search className="h-3.5 w-3.5" />
        </div>

        {/* Input */}
        <input
          type="text"
          inputMode="numeric"
          placeholder="Block height…"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError("");
          }}
          disabled={disabled}
          className={cn(
            "w-40 border border-r-0 border-[rgba(120,72,18,0.55)] bg-[rgba(7,7,9,0.6)] px-3 py-2",
            "font-mono text-xs text-zinc-200 placeholder-zinc-600 outline-none",
            "focus:border-primary/50 focus:bg-[rgba(247,147,26,0.04)]",
            "disabled:opacity-50"
          )}
        />

        {/* Go button */}
        <button
          type="submit"
          disabled={disabled}
          className={cn(
            "border border-[rgba(120,72,18,0.55)] bg-[rgba(247,147,26,0.08)] px-3 py-2",
            "font-mono text-xs font-bold uppercase tracking-[0.18em] text-primary",
            "transition-colors hover:bg-[rgba(247,147,26,0.16)]",
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
