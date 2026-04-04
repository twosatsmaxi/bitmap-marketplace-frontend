"use client";

import { useCallback } from "react";
import { X, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToastStore, type Toast as ToastType, type ToastVariant } from "@/stores/toast-store";

/* ------------------------------------------------------------------ */
/*  Variant styles                                                     */
/* ------------------------------------------------------------------ */

const variantStyles: Record<ToastVariant, { border: string; icon: string }> = {
  default: {
    border: "border-zinc-700/60",
    icon: "text-[var(--color-primary)]",
  },
  success: {
    border: "border-emerald-800/60",
    icon: "text-emerald-400",
  },
  error: {
    border: "border-red-800/60",
    icon: "text-red-400",
  },
};

function VariantIcon({ variant }: { variant: ToastVariant }) {
  const iconClass = cn("h-4 w-4 shrink-0", variantStyles[variant].icon);

  switch (variant) {
    case "success":
      return <CheckCircle2 className={iconClass} />;
    case "error":
      return <AlertCircle className={iconClass} />;
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Single Toast                                                       */
/* ------------------------------------------------------------------ */

function ToastItem({ toast }: { toast: ToastType }) {
  const markExiting = useToastStore((s) => s.markExiting);
  const dismissToast = useToastStore((s) => s.dismissToast);

  const handleDismiss = useCallback(() => {
    markExiting(toast.id);
    setTimeout(() => dismissToast(toast.id), 300);
  }, [toast.id, markExiting, dismissToast]);

  const style = variantStyles[toast.variant];

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        // Layout
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-md border px-4 py-3",
        // Dark bg + warm border
        "bg-zinc-900/95 backdrop-blur-sm shadow-lg shadow-black/30",
        style.border,
        // Animation
        toast.exiting
          ? "animate-toast-out"
          : "animate-toast-in",
      )}
    >
      <VariantIcon variant={toast.variant} />

      <div className="flex-1 min-w-0">
        <p className="font-mono text-sm font-medium text-zinc-100 leading-tight">
          {toast.title}
        </p>
        {toast.description && (
          <p className="mt-1 font-mono text-xs text-zinc-400 leading-snug">
            {toast.description}
          </p>
        )}
      </div>

      <button
        onClick={handleDismiss}
        className="shrink-0 rounded p-0.5 text-zinc-500 transition-colors hover:text-zinc-200"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Toast Container — render once in layout                            */
/* ------------------------------------------------------------------ */

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-2 pointer-events-none"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
