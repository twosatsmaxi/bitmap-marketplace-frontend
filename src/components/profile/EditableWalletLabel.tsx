"use client";

import { useState, useRef, useEffect } from "react";
import { truncateAddr, cn } from "@/lib/utils";

interface EditableWalletLabelProps {
  address: string;
  label: string;
  isActive?: boolean;
  onLabelChange?: (newLabel: string) => void;
  onToggleFilter?: () => void;
}

const MAX_LABEL_LENGTH = 20;

export function EditableWalletLabel({
  address,
  label,
  isActive,
  onLabelChange,
  onToggleFilter,
}: EditableWalletLabelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) {
      setInputValue(label);
    }
  }, [label, isEditing]);

  const handleSave = () => {
    const trimmed = inputValue.trim();
    const finalLabel = trimmed || label;

    setIsEditing(false);
    setInputValue(finalLabel);

    if (onLabelChange && finalLabel !== label) {
      onLabelChange(finalLabel);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setInputValue(label);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1.5 font-mono text-[11px]">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value.slice(0, MAX_LABEL_LENGTH))}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          maxLength={MAX_LABEL_LENGTH}
          className={cn(
            "bg-transparent font-bold text-primary",
            "focus:outline-none",
            "w-[calc(var(--ch-count)*0.72em+1em)] min-w-[3em] max-w-[14em]"
          )}
          style={{ "--ch-count": inputValue.length || 1 } as React.CSSProperties}
          aria-label="Edit wallet label"
        />
        <span className="text-zinc-600">·</span>
        <span className={isActive ? "text-primary/70" : "text-zinc-500"}>
          {truncateAddr(address, 6, 4)}
        </span>
      </div>
    );
  }

  return (
    <div className="group/wallet flex items-center gap-1.5 font-mono text-[11px]">
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className={cn(
          "font-bold truncate max-w-[120px]",
          "transition-colors",
          isActive ? "text-primary" : "text-zinc-400 group-hover/wallet:text-primary"
        )}
        aria-label={`Edit label for ${label}`}
      >
        {label}
      </button>
      <span className="text-zinc-600">·</span>
      <button
        type="button"
        onClick={onToggleFilter}
        className={cn(
          "transition-colors",
          isActive ? "text-primary/70" : "text-zinc-500 hover:text-zinc-300"
        )}
      >
        {truncateAddr(address, 6, 4)}
      </button>
    </div>
  );
}
