"use client";

import { cn } from "@/lib/utils";
import type { CollectionFilterMeta } from "./types";

type FilterGroup = "historical" | "punk" | "numeric";

interface GroupedCollectionFilterMeta extends CollectionFilterMeta {
  group: FilterGroup;
}

interface CollectionFilterPanelProps {
  collections: GroupedCollectionFilterMeta[];
  activeFilter: string | null;
  onToggle: (id: string) => void;
}

const GROUP_LABELS: Record<FilterGroup, string> = {
  historical: "Historical",
  punk: "Punk",
  numeric: "Numeric",
};

const GROUP_COLORS: Record<FilterGroup, string> = {
  historical: "text-blue-400",
  punk: "text-orange-400",
  numeric: "text-emerald-400",
};

export default function CollectionFilterPanel({
  collections,
  activeFilter,
  onToggle,
}: CollectionFilterPanelProps) {
  const sortedCollections = [...collections].sort((a, b) => a.priority - b.priority);
  const activeCollection = sortedCollections.find((c) => c.id === activeFilter);
  const activeLabel = activeCollection?.label;
  const activeHighlight = activeCollection?.highlight;
  const activeGroup = activeCollection?.group;

  const handleClear = () => {
    if (activeFilter) onToggle(activeFilter);
  };

  // Group filters by their group property
  const grouped = sortedCollections.reduce((acc, c) => {
    if (!acc[c.group]) acc[c.group] = [];
    acc[c.group].push(c);
    return acc;
  }, {} as Record<FilterGroup, GroupedCollectionFilterMeta[]>);

  const groupOrder: FilterGroup[] = ["historical", "punk", "numeric"];

  return (
    <div className="br-card p-3 md:p-4 lg:p-5">
      {/* Header */}
      {activeFilter && activeLabel ? (
        <div className="flex items-center justify-between border-l-2 border-primary pl-3">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 shrink-0">
              Filtering by
            </span>
            <span className={cn(
              "font-mono text-[11px] uppercase tracking-[0.18em] shrink-0",
              activeGroup ? GROUP_COLORS[activeGroup] : "text-primary"
            )}>
              {activeLabel}
            </span>
            {activeHighlight && (
              <span className="font-mono text-[10px] text-zinc-400 truncate hidden sm:inline">
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

      {/* Grouped Chips */}
      <div className="mt-3 flex flex-wrap gap-y-2 gap-x-1 md:gap-x-2">
        {groupOrder.map((group, groupIndex) => (
          <div key={group} className="flex items-center">
            {/* Divider between groups (not before first) */}
            {groupIndex > 0 && (
              <div className="hidden md:flex items-center mx-1 md:mx-2">
                <div className="h-5 w-px bg-[rgba(255,255,255,0.12)]" />
              </div>
            )}
            
            {/* Filter chips for this group */}
            <div className="flex items-center gap-1.5 md:gap-2">
              {grouped[group]?.map((c) => {
                const active = activeFilter === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onToggle(c.id)}
                    className={cn(
                      "flex-shrink-0 rounded-full border px-2.5 py-1 md:px-3 md:py-1 font-mono text-[10px] md:text-[11px] uppercase tracking-[0.14em] md:tracking-[0.16em] transition-all active:scale-95",
                      active
                        ? "border-primary bg-primary/[0.15] text-primary shadow-[0_0_10px_rgba(247,147,26,0.25)]"
                        : "border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.03)] text-zinc-400 hover:border-[rgba(247,162,59,0.45)] hover:text-primary"
                    )}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        
        {/* More soon indicator */}
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
