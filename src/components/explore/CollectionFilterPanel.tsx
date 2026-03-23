"use client";

import { cn } from "@/lib/utils";
import type { CollectionFilterMeta } from "./types";
import { useRef, useLayoutEffect } from "react";

type FilterCategory = "historical" | "punk" | "numeric";

interface CategorizedFilterMeta extends CollectionFilterMeta {
  category: FilterCategory;
}

interface CollectionFilterPanelProps {
  collections: CategorizedFilterMeta[];
  activeFilter: string | null;
  onToggle: (id: string) => void;
}

const CATEGORY_ICONS: Record<FilterCategory, string> = {
  historical: "◆",
  punk: "◈",
  numeric: "◇",
};

// FilterChip defined outside component to prevent remounts on re-render
interface FilterChipProps {
  c: CategorizedFilterMeta;
  activeFilter: string | null;
  onToggle: (id: string) => void;
}

const FilterChip = ({ c, activeFilter, onToggle }: FilterChipProps) => {
  const active = activeFilter === c.id;
  return (
    <button
      key={c.id}
      type="button"
      onClick={() => onToggle(c.id)}
      className={cn(
        "flex-shrink-0 rounded-full border px-3 py-1.5 md:px-3 md:py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] transition-all active:scale-95",
        active
          ? "border-primary bg-primary/[0.15] text-primary shadow-[0_0_10px_rgba(247,147,26,0.25)]"
          : "border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.03)] text-zinc-400 hover:border-[rgba(247,162,59,0.45)] hover:text-primary"
      )}
    >
      {c.label}
    </button>
  );
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

  const handleClear = () => {
    if (activeFilter) onToggle(activeFilter);
  };

  // Group by category
  const byCategory = sortedCollections.reduce((acc, c) => {
    if (!acc[c.category]) acc[c.category] = [];
    acc[c.category].push(c);
    return acc;
  }, {} as Record<FilterCategory, CategorizedFilterMeta[]>);

  const rowOrder: FilterCategory[] = ["historical", "punk", "numeric"];

  // Preserve scroll position of the filter row across re-renders
  const row1Ref = useRef<HTMLDivElement>(null);
  const scrollLeftRef = useRef<number>(0);

  // Save scroll position before browser paints
  useLayoutEffect(() => {
    if (row1Ref.current) {
      scrollLeftRef.current = row1Ref.current.scrollLeft;
    }
  });

  // Restore scroll position after render
  useLayoutEffect(() => {
    if (row1Ref.current && scrollLeftRef.current > 0) {
      row1Ref.current.scrollLeft = scrollLeftRef.current;
    }
  });

  return (
    <div className="br-card p-3 md:p-4 lg:p-5">
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

      {/* 2 Rows of filters */}
      <div className="mt-3 flex flex-col gap-2">
        {/* Row 1: Historical + Punk (with divider) */}
        <div ref={row1Ref} className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
          {byCategory["historical"]?.map((c) => <FilterChip key={c.id} c={c} activeFilter={activeFilter} onToggle={onToggle} />)}
          
          {/* Divider between groups */}
          <div className="flex items-center mx-1 md:mx-2">
            <div className="h-4 w-px bg-[rgba(255,255,255,0.12)]" />
          </div>
          
          {byCategory["punk"]?.map((c) => <FilterChip key={c.id} c={c} activeFilter={activeFilter} onToggle={onToggle} />)}
        </div>
        
        {/* Row 2: Numeric */}
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
          {byCategory["numeric"]?.map((c) => <FilterChip key={c.id} c={c} activeFilter={activeFilter} onToggle={onToggle} />)}
          
          {/* More soon inline */}
          <div className="flex items-center gap-2 ml-2 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-600">
            <span>More soon</span>
            <div className="flex gap-[4px]">
              <span className="h-[3px] w-[3px] bg-primary"></span>
              <span className="h-[3px] w-[3px] bg-primary opacity-60"></span>
              <span className="h-[3px] w-[3px] bg-primary opacity-30"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
