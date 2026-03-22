"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface BlockSelectorProps {
  currentHeight: number;
  onHeightChange: (height: number) => void;
  txCount?: number;
  disabled?: boolean;
  maxHeight?: number | null;
}

export function BlockSelector({ currentHeight, onHeightChange, txCount, disabled, maxHeight }: BlockSelectorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(currentHeight.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  // Update value when currentHeight changes externally
  useEffect(() => {
    if (!isEditing) {
      setValue(currentHeight.toString());
    }
  }, [currentHeight, isEditing]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSubmit = useCallback(() => {
    let height = parseInt(value, 10);
    if (!isNaN(height) && height > 0) {
      // Limit to chain tip if available
      if (maxHeight !== null && maxHeight !== undefined && height > maxHeight) {
        height = maxHeight;
      }
      onHeightChange(height);
    }
    setIsEditing(false);
    setValue(currentHeight.toString());
  }, [value, onHeightChange, currentHeight, maxHeight]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setValue(currentHeight.toString());
    }
  }, [handleSubmit, currentHeight]);

  const handleBlur = useCallback(() => {
    handleSubmit();
  }, [handleSubmit]);

  const startEditing = useCallback(() => {
    if (disabled) return;
    setIsEditing(true);
    setValue(currentHeight.toString());
  }, [currentHeight, disabled]);

  // Handle input change with max limit
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // Only allow digits
    if (!/^\d*$/.test(newValue)) return;
    
    // If we have a max height, prevent entering values that exceed it
    if (maxHeight !== null && maxHeight !== undefined && newValue !== "") {
      const numValue = parseInt(newValue, 10);
      if (!isNaN(numValue) && numValue > maxHeight) {
        setValue(maxHeight.toString());
        return;
      }
    }
    
    setValue(newValue);
  }, [maxHeight]);

  return (
    <div className="absolute left-1/2 -translate-x-1/2 z-10 mt-8 md:mt-0" style={{ top: "calc(var(--header-total) + 1rem)" }}>
      {/* Title row - stack on mobile, row on desktop */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-3">
        <div className="flex items-baseline">
          {isEditing ? (
            <span className="font-mono text-xl md:text-2xl font-bold">
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                disabled={disabled}
                className="bg-transparent font-mono text-xl md:text-2xl font-bold text-primary p-0 m-0 border-0 outline-none shadow-none focus:outline-none focus:border-0 focus:ring-0"
                style={{ 
                  width: `${Math.max(value.length, 1)}ch`,
                  appearance: 'none',
                  WebkitAppearance: 'none'
                }}
              />
              <span className="text-zinc-600">.bitmap</span>
            </span>
          ) : (
            <button
              onClick={startEditing}
              disabled={disabled}
              className={cn(
                "font-mono text-xl md:text-2xl font-bold cursor-text group",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <span className="text-primary group-hover:text-primary/80 transition-colors">
                {currentHeight.toLocaleString()}
              </span>
              <span className="text-zinc-600">.bitmap</span>
            </button>
          )}
        </div>

        {txCount != null && (
          <>
            <div className="hidden md:block h-5 w-px bg-[rgba(255,255,255,0.12)]" />
            <span className="font-mono text-[10px] md:text-xs text-zinc-500">
              {txCount.toLocaleString()} <span className="text-[9px] md:text-[10px] uppercase tracking-[0.1em]">txns</span>
            </span>
          </>
        )}
      </div>
    </div>
  );
}
