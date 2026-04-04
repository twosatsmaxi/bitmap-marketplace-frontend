"use client";

import { useCallback } from "react";
import { useToastStore, type ToastVariant } from "@/stores/toast-store";

interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** Auto-dismiss duration in milliseconds. Default: 3000 */
  duration?: number;
}

export function useToast() {
  const addToast = useToastStore((s) => s.addToast);
  const markExiting = useToastStore((s) => s.markExiting);
  const dismissToast = useToastStore((s) => s.dismissToast);

  const toast = useCallback(
    ({ title, description, variant = "default", duration = 3000 }: ToastOptions) => {
      const id = addToast({ title, description, variant, duration });

      // Auto-dismiss: mark as exiting first, then remove after animation
      setTimeout(() => {
        markExiting(id);
        setTimeout(() => {
          dismissToast(id);
        }, 300); // matches the CSS exit animation duration
      }, duration);

      return id;
    },
    [addToast, markExiting, dismissToast]
  );

  return { toast };
}
