"use client";

import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export default function EmptyState({
  title = "No results found",
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "border border-dashed border-zinc-700 bg-black/20 rounded-lg",
        "py-16 md:py-20 px-6 text-center",
        className,
      )}
    >
      <p className="font-mono text-sm uppercase tracking-widest text-zinc-500">
        {title}
      </p>
      {description && (
        <p className="mt-2 font-mono text-xs text-zinc-600 max-w-md mx-auto">
          {description}
        </p>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className={cn(
            "mt-4 inline-flex items-center px-4 py-2 font-mono text-xs uppercase tracking-[0.12em]",
            "border border-zinc-700 rounded-md text-zinc-400",
            "transition-colors hover:border-primary/50 hover:text-primary hover:bg-primary/[0.06]",
            "active:scale-95",
          )}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
