"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Blocks } from "lucide-react";

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
    <div className="absolute left-1/2 -translate-x-1/2 z-10 mt-4 md:mt-0" style={{ top: "calc(var(--header-total) + 1rem)" }}>
      {/* Title row */}
      <div className="flex flex-row items-center justify-center gap-2 md:gap-4">
        <div className="flex items-baseline gap-1">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 border border-primary/50 bg-primary/10 flex items-center justify-center">
                <Blocks className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="font-heading text-2xl md:text-3xl font-bold">
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
                  className="bg-transparent font-heading text-2xl md:text-3xl font-bold text-primary p-0 m-0 border-0 outline-none shadow-none focus:outline-none focus:border-0 focus:ring-0"
                  style={{ 
                    width: `${Math.max(value.length, 1)}ch`,
                    appearance: 'none',
                    WebkitAppearance: 'none'
                  }}
                />
                <span className="text-text-secondary/50">.bitmap</span>
              </span>
            </div>
          ) : (
            <button
              onClick={startEditing}
              disabled={disabled}
              className={cn(
                "flex items-center gap-2 cursor-text group",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <div className="w-6 h-6 border border-primary/50 bg-primary/10 flex items-center justify-center transition-colors group-hover:border-primary group-hover:bg-primary/20">
                <Blocks className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="font-heading text-2xl md:text-3xl font-bold">
                <span className="text-primary group-hover:text-primary/80 transition-colors">
                  {currentHeight.toLocaleString()}
                </span>
                <span className="text-text-secondary/50">.bitmap</span>
              </span>
            </button>
          )}
        </div>

        {txCount != null && (
          <>
            <div className="hidden md:block h-5 w-px bg-border" />
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] md:text-xs text-text-secondary">
                {txCount.toLocaleString()}
              </span>
              <span className="font-mono text-[9px] md:text-[10px] uppercase tracking-[0.15em] text-text-secondary/60">
                txns
              </span>
            </div>
          </>
        )}
      </div>
      
      {/* Subtle hint text */}
      <p className="text-center mt-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-text-secondary/40">
          Tap to edit
        </span>
      </p>
    </div>
  );
}
