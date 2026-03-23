"use client";

import type { BrowseFilters, BitmapType, RarityTier } from "@/lib/types";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import BottomSheet from "@/components/ui/BottomSheet";
import { useState, useEffect, useRef, useMemo } from "react";

interface MobileFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: BrowseFilters;
  onFiltersChange: (filters: BrowseFilters) => void;
}

const BITMAP_TYPES: BitmapType[] = ["city", "grid", "mondrian", "punk", "palindrome"];
const RARITIES: RarityTier[] = ["common", "uncommon", "rare", "epic", "legendary"];

export default function MobileFilterSheet({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
}: MobileFilterSheetProps) {
  // Local state for draft filters (apply on confirm)
  const [draftFilters, setDraftFilters] = useState<BrowseFilters>(filters);
  const prevIsOpenRef = useRef(isOpen);

  // Reset draft only when sheet opens (transition from closed -> open)
  useEffect(() => {
    const wasOpen = prevIsOpenRef.current;
    if (isOpen && !wasOpen) {
      setDraftFilters(filters);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]); // Only depend on isOpen, not filters

  const activeCount = useMemo(() => {
    return (
      draftFilters.status.length +
      draftFilters.types.length +
      draftFilters.rarities.length +
      (draftFilters.search ? 1 : 0)
    );
  }, [draftFilters]);

  const handleApply = () => {
    onFiltersChange(draftFilters);
    onClose();
  };

  const handleClear = () => {
    const cleared = {
      search: "",
      status: [],
      types: [],
      rarities: [],
    };
    setDraftFilters(cleared);
    onFiltersChange(cleared);
  };

  const toggleType = (type: BitmapType) => {
    setDraftFilters((prev) => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter((t) => t !== type)
        : [...prev.types, type],
    }));
  };

  const toggleRarity = (rarity: RarityTier) => {
    setDraftFilters((prev) => ({
      ...prev,
      rarities: prev.rarities.includes(rarity)
        ? prev.rarities.filter((r) => r !== rarity)
        : [...prev.rarities, rarity],
    }));
  };

  const toggleStatus = (status: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      status: prev.status.includes(status as any)
        ? prev.status.filter((s) => s !== status)
        : [...prev.status, status as any],
    }));
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Filter Assets"
      className="max-h-[80vh]"
    >
      <div className="flex flex-col gap-6">
        {/* Search */}
        <div>
          <h3 className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
            Search Index
          </h3>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-zinc-500" />
            </div>
            <input
              type="text"
              value={draftFilters.search}
              onChange={(e) =>
                setDraftFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              placeholder="Block number..."
              className="w-full rounded-md border border-[rgba(120,72,18,0.55)] bg-[rgba(10,10,12,0.92)] px-3 py-3 pl-10 font-mono text-sm uppercase tracking-[0.1em] text-zinc-300 transition-colors placeholder:text-zinc-600 focus:border-primary focus:outline-none"
            />
            {draftFilters.search && (
              <button
                onClick={() =>
                  setDraftFilters((prev) => ({ ...prev, search: "" }))
                }
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Status */}
        <div>
          <h3 className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
            Status
          </h3>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "listed", label: "Buy Now" },
              { id: "has_offer", label: "Has Offers" },
              { id: "unlisted", label: "Unlisted" },
            ].map((status) => (
              <FilterChip
                key={status.id}
                label={status.label}
                isActive={draftFilters.status.includes(status.id as any)}
                onClick={() => toggleStatus(status.id)}
              />
            ))}
          </div>
        </div>

        {/* Types */}
        <div>
          <h3 className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
            Pattern Type
          </h3>
          <div className="flex flex-wrap gap-2">
            {BITMAP_TYPES.map((type) => (
              <FilterChip
                key={type}
                label={type}
                isActive={draftFilters.types.includes(type)}
                onClick={() => toggleType(type)}
              />
            ))}
          </div>
        </div>

        {/* Rarities */}
        <div>
          <h3 className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
            Rarity Level
          </h3>
          <div className="flex flex-wrap gap-2">
            {RARITIES.map((rarity) => (
              <FilterChip
                key={rarity}
                label={rarity}
                isActive={draftFilters.rarities.includes(rarity)}
                onClick={() => toggleRarity(rarity)}
                variant="rarity"
              />
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 -mx-4 -mb-4 border-t border-[rgba(120,72,18,0.45)] bg-[rgba(7,7,9,0.98)] px-4 py-4 safe-area-inset-bottom">
          <div className="flex gap-3">
            <button
              onClick={handleClear}
              className="flex-1 rounded-md border border-[rgba(120,72,18,0.55)] bg-transparent px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.18em] text-zinc-400 transition-colors hover:text-primary active:scale-[0.98]"
            >
              Clear All
            </button>
            <button
              onClick={handleApply}
              className="flex-1 rounded-md border border-primary bg-primary px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.18em] text-black transition-all hover:bg-primary/90 active:scale-[0.98]"
            >
              Apply {activeCount > 0 && `(${activeCount})`}
            </button>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}

// Trigger button for mobile filter
interface MobileFilterButtonProps {
  filters: BrowseFilters;
  onClick: () => void;
}

export function MobileFilterButton({ filters, onClick }: MobileFilterButtonProps) {
  const activeCount =
    filters.status.length +
    filters.types.length +
    filters.rarities.length +
    (filters.search ? 1 : 0);

  return (
    <button
      onClick={onClick}
      className="flex h-10 items-center gap-2 rounded-md border border-[rgba(120,72,18,0.55)] bg-[rgba(10,10,12,0.92)] px-3 transition-colors hover:border-primary/50 active:scale-95 md:hidden"
    >
      <SlidersHorizontal className="h-4 w-4 text-zinc-400" />
      <span className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-zinc-300">
        Filter
      </span>
      {activeCount > 0 && (
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 font-mono text-[10px] font-bold text-black">
          {activeCount}
        </span>
      )}
    </button>
  );
}

// Filter chip component
interface FilterChipProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  variant?: "default" | "rarity";
}

function FilterChip({ label, isActive, onClick, variant = "default" }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-2 font-mono text-xs capitalize tracking-[0.08em] transition-all active:scale-95",
        isActive
          ? "border-primary bg-primary/15 text-primary shadow-[0_0_10px_rgba(247,147,26,0.25)]"
          : "border-[rgba(120,72,18,0.45)] bg-[rgba(10,10,12,0.5)] text-zinc-400 hover:border-primary/40 hover:text-zinc-300"
      )}
    >
      {label}
    </button>
  );
}
