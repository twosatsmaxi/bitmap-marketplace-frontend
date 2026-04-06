"use client";

import { useRef, useState, useCallback } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface HoldToRemoveProps {
  onConfirm: () => void;
  duration?: number;
  label?: string;
}

export function HoldToRemove({
  onConfirm,
  duration = 1000,
  label = "Remove wallet",
}: HoldToRemoveProps) {
  const [holding, setHolding] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback(() => {
    setHolding(true);
    timerRef.current = setTimeout(() => {
      setHolding(false);
      onConfirm();
    }, duration);
  }, [onConfirm, duration]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setHolding(false);
  }, []);

  return (
    <button
      type="button"
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      className={cn(
        "relative ml-0.5 flex-shrink-0 overflow-hidden",
        "h-4 w-4 flex items-center justify-center",
        "text-zinc-600 transition-colors",
        holding ? "text-red-400" : "hover:text-red-400"
      )}
      aria-label={label}
    >
      <span
        className={cn(
          "absolute inset-0 origin-left bg-red-500/25",
          holding ? "scale-x-100" : "scale-x-0"
        )}
        style={{
          transition: holding ? `transform ${duration}ms linear` : "transform 150ms ease-out",
        }}
      />
      <X className="relative h-3 w-3" />
    </button>
  );
}
