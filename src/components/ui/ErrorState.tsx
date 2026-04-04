"use client";

import { cn } from "@/lib/utils";

interface ErrorStateProps {
  variant?: "inline" | "block" | "terminal";
  message: string;
  retry?: () => void;
  className?: string;
}

function RetryButton({ retry }: { retry: () => void }) {
  return (
    <button
      type="button"
      onClick={retry}
      className="underline hover:text-red-300 transition-colors"
    >
      Retry
    </button>
  );
}

export default function ErrorState({
  variant = "inline",
  message,
  retry,
  className,
}: ErrorStateProps) {
  if (variant === "inline") {
    return (
      <p className={cn("font-mono text-sm text-red-400", className)}>
        {message}
        {retry && (
          <>
            {" "}
            <RetryButton retry={retry} />
          </>
        )}
      </p>
    );
  }

  if (variant === "terminal") {
    return (
      <div className={cn("font-mono text-sm", className)}>
        <span className="text-red-400">{`> ERR: ${message}`}</span>
        {retry && (
          <div className="mt-1">
            <button
              type="button"
              onClick={retry}
              className="font-mono text-xs text-zinc-500 hover:text-primary transition-colors"
            >
              {">"} retry
            </button>
          </div>
        )}
      </div>
    );
  }

  // block variant
  return (
    <div
      className={cn(
        "border border-red-900/40 bg-red-950/20 rounded-lg",
        "px-4 py-4 text-center",
        className,
      )}
    >
      <p className="font-mono text-sm text-red-400">{message}</p>
      {retry && (
        <div className="mt-3">
          <button
            type="button"
            onClick={retry}
            className={cn(
              "inline-flex items-center px-3 py-1.5 font-mono text-xs uppercase tracking-[0.12em]",
              "border border-red-900/50 rounded-md text-red-400",
              "transition-colors hover:border-red-700 hover:text-red-300 hover:bg-red-950/40",
              "active:scale-95",
            )}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
