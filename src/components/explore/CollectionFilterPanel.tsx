"use client";

import { useState } from "react";
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
  const [showAll, setShowAll] = useState(false);
  const sortedCollections = [...collections].sort((a, b) => a.priority - b.priority);
  const primaryChips = sortedCollections.slice(0, 6);
  const secondaryChips = sortedCollections.slice(6);
  const hiddenCount = secondaryChips.length;

  const chipClass = (active: boolean) =>
    cn(
      "rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] transition-colors",
      active
        ? "border-primary bg-primary/[0.15] text-primary shadow-[0_0_10px_rgba(247,147,26,0.25)]"
        : "border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.03)] text-zinc-400 hover:border-[rgba(247,162,59,0.45)] hover:text-primary"
    );

  const handleClear = () => {
    if (activeFilter) onToggle(activeFilter);
  };

  return (
    <div className="br-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            Traits Filter
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {primaryChips.map((collection) => (
          <button
            key={collection.id}
            type="button"
            onClick={() => onToggle(collection.id)}
            className={chipClass(activeFilter === collection.id)}
          >
            {collection.label}
          </button>
        ))}

        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            className="rounded-full border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.08)] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-200 transition-colors hover:border-primary hover:text-primary"
          >
            {showAll ? "Show less" : `+ More (${hiddenCount})`}
          </button>
        )}

        <button
          type="button"
          onClick={handleClear}
          disabled={!activeFilter}
          className="ml-auto rounded-full border border-[rgba(255,255,255,0.12)] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500 transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
        >
          Clear
        </button>
      </div>

      {showAll && hiddenCount > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {secondaryChips.map((collection) => (
            <button
              key={collection.id}
              type="button"
              onClick={() => onToggle(collection.id)}
              className={chipClass(activeFilter === collection.id)}
            >
              {collection.label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-2 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
        More soon
      </div>
    </div>
  );
}
