"use client";

import { cn } from "@/lib/utils";
import type { CollectionFilterMeta } from "./types";

interface CollectionFilterPanelProps {
  collections: CollectionFilterMeta[];
  activeFilter: string | null;
  onToggle: (id: string) => void;
}



export default function CollectionFilterPanel({
  collections,
  activeFilter,
  onToggle,
}: CollectionFilterPanelProps) {
  const sortedCollections = [...collections].sort((a, b) => a.priority - b.priority);
  const activeCollection = sortedCollections.find((c) => c.id === activeFilter);
  const activeLabel = activeCollection?.label;
  const activeHighlight = activeCollection?.highlight;

  const handleClear = () => {
    if (activeFilter) onToggle(activeFilter);
  };

  return (
    <div className="br-card p-4 md:p-5">
      {/* Header */}
      {activeFilter && activeLabel ? (
        <div className="flex items-center justify-between border-l-2 border-primary pl-3">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 shrink-0">
              Filtering by
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary shrink-0">
              {activeLabel}
            </span>
            {activeHighlight && (
              <span className="font-mono text-[10px] text-zinc-400 truncate">
                ({activeHighlight})
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="ml-3 shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500 transition-colors hover:text-primary"
          >
            ✕ Clear
          </button>
        </div>
      ) : (
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          Traits Filter
        </p>
      )}

      {/* Chips */}
      <div className="mt-3 flex flex-wrap gap-2">
        {sortedCollections.map((c) => {
          const active = activeFilter === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onToggle(c.id)}
              className={cn(
                "rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors",
                active
                  ? "border-primary bg-primary/[0.15] text-primary shadow-[0_0_10px_rgba(247,147,26,0.25)]"
                  : "border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.03)] text-zinc-400 hover:border-[rgba(247,162,59,0.45)] hover:text-primary"
              )}
            >
              {c.label}
            </button>
          );
        })}
        <div className="flex items-center gap-2 px-2 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-600">
          <span>More soon</span>
          <div className="flex gap-[4px]">
            <span className="h-[3px] w-[3px] bg-primary"></span>
            <span className="h-[3px] w-[3px] bg-primary opacity-60"></span>
            <span className="h-[3px] w-[3px] bg-primary opacity-30"></span>
          </div>
        </div>
      </div>
    </div>
  );
}
