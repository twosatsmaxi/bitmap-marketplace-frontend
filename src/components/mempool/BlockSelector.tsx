"use client";

import { useState, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

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

  const handlePrev = useCallback(() => {
    const newHeight = currentHeight - 1;
    onHeightChange(newHeight);
    setInputValue(newHeight.toString());
  }, [currentHeight, onHeightChange]);

  const handleNext = useCallback(() => {
    const newHeight = currentHeight + 1;
    onHeightChange(newHeight);
    setInputValue(newHeight.toString());
  }, [currentHeight, onHeightChange]);

  return (
    <div className="absolute top-6 left-6 z-10">
      <div className="bg-black/80 backdrop-blur-md rounded-xl border border-white/10 p-4 shadow-2xl">
        {/* Current Block Display */}
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={handlePrev}
            disabled={disabled}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Previous Block"
          >
            <ChevronLeft className="w-4 h-4 text-zinc-400" />
          </button>
          
          <div 
            className="flex-1 text-center cursor-pointer"
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              Block Height
            </div>
            <div className="font-mono text-2xl font-bold text-primary">
              {currentHeight.toLocaleString()}
            </div>
          </div>
          
          <button
            onClick={handleNext}
            disabled={disabled}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Next Block"
          >
            <ChevronRight className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        {/* Search Input */}
        {isOpen && (
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter block height..."
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

        {/* Toggle Search */}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="w-full mt-2 py-1.5 text-center font-mono text-[10px] uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Search Block
          </button>
        )}
      </div>

      {/* Quick Presets */}
      <div className="mt-2 flex flex-wrap gap-2">
        {[800150, 800000, 790000, 750000].map((height) => (
          <button
            key={height}
            onClick={() => {
              onHeightChange(height);
              setInputValue(height.toString());
            }}
            className={`px-2 py-1 rounded font-mono text-[10px] uppercase transition-colors ${
              currentHeight === height
                ? "bg-primary/30 text-primary border border-primary/50"
                : "bg-black/50 text-zinc-500 border border-white/10 hover:text-zinc-300"
            }`}
          >
            {height.toLocaleString()}
          </button>
        ))}
      </div>
    </div>
  );
}
