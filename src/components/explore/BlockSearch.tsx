"use client";

import { useState, FormEvent } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface BlockSearchProps {
  onSearch: (height: number) => void;
  disabled?: boolean;
}

const MAX_BLOCK = 1_000_000;

export default function BlockSearch({ onSearch, disabled }: BlockSearchProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0 || num > MAX_BLOCK) {
      setError(`Pick a block between 0 and ${MAX_BLOCK.toLocaleString()}`);
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
    
    // Prevent input above max
    const num = parseInt(input, 10);
    if (input !== "" && !isNaN(num) && num > MAX_BLOCK) {
      setValue(MAX_BLOCK.toString());
      setError(`Max block is ${MAX_BLOCK.toLocaleString()}`);
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
          max={MAX_BLOCK}
          placeholder="Jump to #"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className={cn(
            "w-full sm:w-44 rounded border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.07)] py-2 pl-8 pr-3",
            "font-mono text-xs text-zinc-200 placeholder-zinc-600 outline-none",
            "focus:border-[rgba(255,255,255,0.25)] focus:bg-[rgba(255,255,255,0.09)]",
            "disabled:opacity-50"
          )}
        />
      </div>

      {error && (
        <span className="font-mono text-[10px] text-red-500/80">{error}</span>
      )}
    </form>
  );
}
