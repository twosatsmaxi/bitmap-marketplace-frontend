"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Pencil } from "lucide-react";
import { useWalletLabelsStore } from "@/stores/wallet-labels";
import { cn } from "@/lib/utils";

interface EditableWalletLabelProps {
  address: string;
  defaultLabel: string;
  onLabelChange?: (newLabel: string) => void;
}

const MAX_LABEL_LENGTH = 20;

export function EditableWalletLabel({
  address,
  defaultLabel,
  onLabelChange,
}: EditableWalletLabelProps) {
  const { getLabel, setLabel } = useWalletLabelsStore();
  const currentLabel = getLabel(address) ?? defaultLabel;

  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(currentLabel);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Sync input value if label changes externally
  useEffect(() => {
    if (!isEditing) {
      setInputValue(currentLabel);
    }
  }, [currentLabel, isEditing]);

  const handleSave = useCallback(() => {
    const trimmed = inputValue.trim();
    const finalLabel = trimmed || defaultLabel;
    
    setLabel(address, finalLabel);
    setIsEditing(false);
    setInputValue(finalLabel);
    
    if (onLabelChange && finalLabel !== currentLabel) {
      onLabelChange(finalLabel);
    }
  }, [address, currentLabel, defaultLabel, inputValue, onLabelChange, setLabel]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setInputValue(currentLabel);
  }, [currentLabel]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case "Enter":
          e.preventDefault();
          handleSave();
          break;
        case "Escape":
          e.preventDefault();
          handleCancel();
          break;
      }
    },
    [handleSave, handleCancel]
  );

  const handleBlur = useCallback(() => {
    handleSave();
  }, [handleSave]);

  const handleClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value.slice(0, MAX_LABEL_LENGTH))}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        maxLength={MAX_LABEL_LENGTH}
        className={cn(
          "w-full min-w-[80px] bg-transparent px-1 py-0.5",
          "font-mono text-xs text-primary",
          "border-b border-primary",
          "focus:outline-none focus:border-primary"
        )}
        aria-label="Edit wallet label"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "group inline-flex items-center gap-1.5",
        "font-mono text-xs text-primary",
        "transition-colors hover:text-primary/80",
        "focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
      )}
      aria-label={`Edit label for ${currentLabel}`}
    >
      <span className="truncate max-w-[120px]">{currentLabel}</span>
      <Pencil className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
