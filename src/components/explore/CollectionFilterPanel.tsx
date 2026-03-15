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
  const spotlight = sortedCollections.slice(0, 3);
  const detail = sortedCollections.slice(3);

  return (
    <div className="br-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            Collections Filter
          </p>
          <p className="mt-1 font-mono text-[11px] text-zinc-400">
            Tap a collection to narrow the grid. This view keeps focus on the highest-priority sets.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {spotlight.map((collection) => (
          <button
            key={collection.id}
            type="button"
            onClick={() => onToggle(collection.id)}
            className={cn(
              "flex flex-col gap-1 rounded-[18px] border px-4 py-3 text-left transition-all",
              activeFilter === collection.id
                ? "border-primary bg-[rgba(247,147,26,0.15)] text-primary shadow-[0_10px_25px_rgba(247,147,26,0.25)]"
                : "border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.02)] text-zinc-200 hover:border-[rgba(247,162,59,0.35)] hover:text-primary"
            )}
          >
            <span className="font-mono text-sm font-bold uppercase tracking-[0.16em]">
              {collection.label}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              {collection.group}
            </span>
            <span className="font-mono text-[11px] text-zinc-400">{collection.highlight}</span>
          </button>
        ))}
      </div>

      {detail.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {detail.map((collection) => (
            <button
              key={collection.id}
              type="button"
              onClick={() => onToggle(collection.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em]",
                activeFilter === collection.id
                  ? "border-primary bg-primary/[0.15] text-primary"
                  : "border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.03)] text-zinc-400 hover:border-[rgba(247,162,59,0.45)] hover:text-primary"
              )}
            >
              {collection.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
