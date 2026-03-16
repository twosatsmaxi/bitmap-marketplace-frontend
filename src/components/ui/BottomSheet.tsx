"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  showHandle?: boolean;
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  className,
  showHandle = true,
}: BottomSheetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const isDraggingRef = useRef(false);

  // Handle open/close animations
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Small delay to ensure the element is rendered before animating
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
      document.body.style.overflow = "hidden";
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setIsVisible(false);
        document.body.style.overflow = "";
      }, 300);
      return () => clearTimeout(timer);
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Touch drag handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    isDraggingRef.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDraggingRef.current || !sheetRef.current) return;

    currentYRef.current = e.touches[0].clientY;
    const deltaY = currentYRef.current - startYRef.current;

    // Only allow dragging down
    if (deltaY > 0) {
      sheetRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isDraggingRef.current || !sheetRef.current) return;

    const deltaY = currentYRef.current - startYRef.current;
    const threshold = 100; // pixels to trigger close

    if (deltaY > threshold) {
      onClose();
    } else {
      // Snap back
      sheetRef.current.style.transform = "";
    }

    isDraggingRef.current = false;
    startYRef.current = 0;
    currentYRef.current = 0;
  }, [onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          isAnimating ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "absolute bottom-0 left-0 right-0 flex max-h-[85vh] flex-col rounded-t-2xl border-t border-[rgba(120,72,18,0.55)] bg-[rgba(7,7,9,0.98)] shadow-2xl transition-transform duration-300 ease-out",
          isAnimating ? "translate-y-0" : "translate-y-full",
          className
        )}
        style={{ willChange: "transform" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="dialog"
        aria-modal="true"
        aria-label={title || "Bottom sheet"}
      >
        {/* Handle bar */}
        {showHandle && (
          <div className="flex w-full items-center justify-center pt-3 pb-1">
            <div className="h-1 w-12 rounded-full bg-zinc-700" />
          </div>
        )}

        {/* Header */}
        {(title || showHandle) && (
          <div className="flex items-center justify-between border-b border-[rgba(120,72,18,0.35)] px-4 py-3">
            {title && (
              <h2 className="font-mono text-base font-bold uppercase tracking-[0.12em] text-primary">
                {title}
              </h2>
            )}
            <button
              onClick={onClose}
              className="ml-auto flex h-10 w-10 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-[rgba(247,147,26,0.1)] hover:text-primary active:scale-95"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 safe-area-inset-bottom">
          {children}
        </div>
      </div>
    </div>
  );
}
