"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface BlockSelectorProps {
  currentHeight: number;
  onHeightChange: (height: number) => void;
  txCount?: number;
  disabled?: boolean;
}

export function BlockSelector({ currentHeight, onHeightChange, txCount, disabled }: BlockSelectorProps) {
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
    const height = parseInt(value, 10);
    if (!isNaN(height) && height > 0) {
      onHeightChange(height);
    }
    setIsEditing(false);
    setValue(currentHeight.toString());
  }, [value, onHeightChange, currentHeight]);

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

  return (
    <div className="absolute left-1/2 -translate-x-1/2 z-10" style={{ top: "calc(var(--header-total) + 1rem)" }}>
      {/* Title row */}
      <div className="flex items-center justify-center gap-3">
        <div className="flex items-baseline">
          {isEditing ? (
            <span className="font-mono text-2xl font-bold">
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={value}
                onChange={(e) => {
                  if (/^\d*$/.test(e.target.value)) setValue(e.target.value);
                }}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                disabled={disabled}
                className="bg-transparent font-mono text-2xl font-bold text-primary p-0 m-0 border-0 outline-none shadow-none focus:outline-none focus:border-0 focus:ring-0"
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
                "font-mono text-2xl font-bold cursor-text group",
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
            <div className="h-5 w-px bg-[rgba(255,255,255,0.12)]" />
            <span className="font-mono text-xs text-zinc-500">
              {txCount.toLocaleString()} <span className="text-[10px] uppercase tracking-[0.1em]">txns</span>
            </span>
          </>
        )}
      </div>
    </div>
  );
}
