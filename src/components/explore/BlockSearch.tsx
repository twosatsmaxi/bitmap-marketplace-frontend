"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface BlockSearchProps {
  onSearch: (height: number) => void;
  latestBlock: number;
  currentHeight?: number;
  disabled?: boolean;
}

export default function BlockSearch({ onSearch, latestBlock, currentHeight, disabled }: BlockSearchProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Use currentHeight if provided, otherwise fall back to latestBlock
  const displayHeight = currentHeight ?? latestBlock;

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSubmit = useCallback(() => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0 || num > latestBlock) {
      setError(`Pick a block between 0 and ${latestBlock.toLocaleString()}`);
      setIsEditing(false);
      setValue("");
      return;
    }
    setError("");
    onSearch(num);
    setIsEditing(false);
    setValue("");
  }, [value, latestBlock, onSearch]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setValue("");
      setError("");
    }
  }, [handleSubmit]);

  const handleBlur = useCallback(() => {
    handleSubmit();
  }, [handleSubmit]);

  const startEditing = useCallback(() => {
    if (disabled) return;
    setIsEditing(true);
    setValue("");
    setError("");
  }, [disabled]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
  }, [latestBlock, error]);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline">
        {isEditing ? (
          <span className="font-mono text-sm md:text-base font-bold">
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              min={0}
              max={latestBlock}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              disabled={disabled}
              placeholder={displayHeight.toLocaleString()}
              className="bg-transparent font-mono text-sm md:text-base font-bold text-primary p-0 m-0 border-0 outline-none shadow-none focus:outline-none focus:border-0 focus:ring-0"
              style={{ 
                width: `${Math.max(value.length || displayHeight.toLocaleString().length, 3)}ch`,
                minWidth: '4ch'
              }}
            />
            <span className="text-zinc-600">.bitmap</span>
          </span>
        ) : (
          <button
            onClick={startEditing}
            disabled={disabled}
            className={cn(
              "font-mono text-sm md:text-base font-bold cursor-text group",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <span className="text-primary group-hover:text-primary/80 transition-colors">
              {displayHeight.toLocaleString()}
            </span>
            <span className="text-zinc-600">.bitmap</span>
          </button>
        )}
      </div>

      {error && (
        <span className="font-mono text-[10px] text-red-500/80">{error}</span>
      )}
    </div>
  );
}
