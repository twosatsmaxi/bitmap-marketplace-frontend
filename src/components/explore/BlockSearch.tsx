"use client";

import { useState, FormEvent } from "react";
import { Search, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BlockSearchProps {
  onSearch: (height: number) => void;
  latestBlock: number;
  disabled?: boolean;
}

export default function BlockSearch({ onSearch, latestBlock, disabled }: BlockSearchProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0 || num > latestBlock) {
      setError(`Pick a block between 0 and ${latestBlock.toLocaleString()}`);
      return;
    }
    setError("");
    onSearch(num);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target.value;
    
    // Only allow numeric characters
    if (!/^\d*$/.test(input)) {
      return;
    }
    
    // Prevent input above latest block
    const num = parseInt(input, 10);
    if (input !== "" && !isNaN(num) && num > latestBlock) {
      setValue(latestBlock.toString());
      setError(`Max block is ${latestBlock.toLocaleString()}`);
      return;
    }
    
    setValue(input);
    if (error) setError("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1">
      <div className="relative flex items-center">
        <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-zinc-600" />
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          min={0}
          max={latestBlock}
          placeholder={`0-${latestBlock.toLocaleString()}`}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className={cn(
            "w-full sm:w-44 rounded border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.07)] py-2 pl-8 pr-10",
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

      {error && (
        <span className="font-mono text-[10px] text-red-500/80">{error}</span>
      )}
    </form>
  );
}
