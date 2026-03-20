"use client";

import { useState, useCallback } from "react";
import { Search } from "lucide-react";

interface BlockSelectorProps {
  currentHeight: number;
  onHeightChange: (height: number) => void;
  disabled?: boolean;
}

export function BlockSelector({ currentHeight, onHeightChange, disabled }: BlockSelectorProps) {
  const [inputValue, setInputValue] = useState(currentHeight.toString());
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const height = parseInt(inputValue, 10);
    if (!isNaN(height) && height > 0) {
      onHeightChange(height);
      setIsOpen(false);
    }
  }, [inputValue, onHeightChange]);

  return (
    <div className="absolute left-6 z-10" style={{ top: "calc(var(--header-total) + 1rem)" }}>
      <div className="bg-black/80 backdrop-blur-md rounded-xl border border-white/10 p-4 shadow-2xl">
        <div
          className="text-center cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            Block Height
          </div>
          <div className="font-mono text-2xl font-bold text-primary">
            {currentHeight.toLocaleString()}
          </div>
        </div>

        {/* Search Input */}
        {isOpen && (
          <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Block height..."
                className="w-full bg-black/50 border border-white/10 rounded-lg pl-9 pr-3 py-2 font-mono text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={disabled}
              className="px-3 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/50 rounded-lg font-mono text-xs font-bold uppercase text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Go
            </button>
          </form>
        )}

        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="w-full mt-2 py-1.5 text-center font-mono text-[10px] uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Search Block
          </button>
        )}
      </div>
    </div>
  );
}
