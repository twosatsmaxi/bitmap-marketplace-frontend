"use client";

import { useState, useMemo } from "react";
import type { Bitmap, BrowseFilters, BrowseSort } from "@/lib/types";
import FilterSidebar from "./FilterSidebar";
import BitmapCard from "./BitmapCard";
import { Search, SlidersHorizontal, ChevronDown, X } from "lucide-react";
import MobileFilterSheet, { MobileFilterButton } from "./MobileFilterSheet";
import { cn } from "@/lib/utils";

interface BrowseClientProps {
  initialBitmaps: Bitmap[];
  total: number;
}

export default function BrowseClient({ initialBitmaps, total }: BrowseClientProps) {
  const [filters, setFilters] = useState<BrowseFilters>({
    search: "",
    status: ["listed"],
    types: [],
    rarities: [],
  });

  const [sort, setSort] = useState<BrowseSort>({
    field: "price",
    direction: "asc"
  });

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filteredBitmaps = useMemo(() => {
    return initialBitmaps.filter(b => {
      if (filters.search && !String(b.blockNumber).includes(filters.search)) return false;
      if (filters.status.length > 0 && !filters.status.includes(b.listingStatus)) return false;
      if (filters.types.length > 0 && !filters.types.includes(b.bitmapType)) return false;
      if (filters.rarities.length > 0 && !filters.rarities.includes(b.rarity)) return false;
      return true;
    }).sort((a, b) => {
      if (sort.field === "price") {
        const pa = a.price || Infinity;
        const pb = b.price || Infinity;
        return sort.direction === "asc" ? pa - pb : pb - pa;
      }
      if (sort.field === "blockNumber") {
        return sort.direction === "asc" ? a.blockNumber - b.blockNumber : b.blockNumber - a.blockNumber;
      }
      return 0;
    });
  }, [initialBitmaps, filters, sort]);

  const activeFilterCount = filters.status.length + filters.types.length + filters.rarities.length + (filters.search ? 1 : 0);

  const clearAllFilters = () => {
    setFilters({ search: "", status: [], types: [], rarities: [] });
  };

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <FilterSidebar filters={filters} setFilters={setFilters} />

      {/* Main Content */}
      <div className="flex-1 min-h-[calc(100vh-var(--header-total))] p-4 md:p-6">
        {/* Header */}
        <section className="home-panel relative overflow-hidden px-4 py-4 md:px-7 md:py-6 mb-4 md:mb-6">
          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="home-eyebrow mb-2">Index Directory</p>
              <h1 className="font-mono text-2xl font-black uppercase tracking-[-0.03em] text-primary md:text-4xl">
                Explore
              </h1>
              <p className="mt-2 max-w-md font-mono text-sm leading-6 text-zinc-400 hidden md:block">
                Discover and acquire on-chain spatial assets anchored directly to Bitcoin blocks.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 md:gap-3 md:min-w-[300px]">
              <Metric value={total} label="Total" />
              <Metric value={filteredBitmaps.length} label="Results" />
              <Metric value={activeFilterCount} label="Filters" />
            </div>
          </div>
        </section>

        {/* Controls Bar */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-[rgba(120,72,18,0.45)]">
          <div className="flex items-center gap-3">
            {/* Mobile Filter Button */}
            <MobileFilterButton
              filters={filters}
              onClick={() => setIsFilterOpen(true)}
            />

            {/* Active Filter Chips - Mobile */}
            <div className="hidden md:flex items-center gap-2">
              {activeFilterCount > 0 && (
                <>
                  {filters.search && (
                    <FilterTag
                      label={`Search: ${filters.search}`}
                      onRemove={() => setFilters(f => ({ ...f, search: "" }))}
                    />
                  )}
                  {filters.types.map(type => (
                    <FilterTag
                      key={type}
                      label={type}
                      onRemove={() => setFilters(f => ({
                        ...f,
                        types: f.types.filter(t => t !== type)
                      }))}
                    />
                  ))}
                  {filters.rarities.map(rarity => (
                    <FilterTag
                      key={rarity}
                      label={rarity}
                      onRemove={() => setFilters(f => ({
                        ...f,
                        rarities: f.rarities.filter(r => r !== rarity)
                      }))}
                    />
                  ))}
                  <button
                    onClick={clearAllFilters}
                    className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500 hover:text-primary transition-colors"
                  >
                    Clear all
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              className="appearance-none border border-[rgba(120,72,18,0.55)] bg-[rgba(10,10,12,0.92)] pl-3 pr-10 py-2 font-mono text-xs uppercase tracking-[0.12em] text-zinc-300 transition-colors focus:border-primary focus:outline-none hover:border-primary/45 cursor-pointer rounded-none h-10"
              value={`${sort.field}-${sort.direction}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split("-") as [BrowseSort["field"], BrowseSort["direction"]];
                setSort({ field, direction });
              }}
            >
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="blockNumber-asc">Block: Ascending</option>
              <option value="blockNumber-desc">Block: Descending</option>
              <option value="recent-desc">Recently Listed</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
          </div>
        </div>

        {/* Results Info - Mobile */}
        <div className="md:hidden mb-4">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-zinc-500">
            <span className="h-1.5 w-1.5 bg-primary/50"></span>
            Showing{" "}
            <span className="font-bold text-zinc-300">{filteredBitmaps.length}</span>{" "}
            results
          </div>
        </div>

        {/* Grid */}
        {filteredBitmaps.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
            {filteredBitmaps.map(bitmap => (
              <BitmapCard key={bitmap.id} bitmap={bitmap} />
            ))}
          </div>
        ) : (
          <div className="home-panel flex flex-col items-center justify-center py-16 md:py-24 text-center px-5">
            <div className="mb-4 flex h-14 w-14 md:h-16 md:w-16 items-center justify-center border border-[rgba(120,72,18,0.55)] bg-black/45">
              <Search className="h-5 w-5 md:h-6 md:w-6 text-zinc-500" />
            </div>
            <h3 className="font-mono text-base md:text-lg font-bold uppercase tracking-[-0.02em] text-primary mb-2">
              No parcels found
            </h3>
            <p className="font-mono text-sm text-zinc-400 max-w-sm">
              Adjust your search query or clear filters to view more assets.
            </p>
            <button
              onClick={clearAllFilters}
              className="mt-6 font-mono text-xs uppercase tracking-[0.18em] text-primary border-b border-primary/30 hover:border-primary transition-colors pb-0.5"
            >
              Reset Query
            </button>
          </div>
        )}
      </div>

      {/* Mobile Filter Sheet */}
      <MobileFilterSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
      />
    </div>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div className="border border-[rgba(120,72,18,0.55)] bg-black/45 px-3 py-2 md:px-4 md:py-3 flex flex-col justify-center">
      <div className="font-mono text-base md:text-lg font-bold text-primary tracking-tight">
        {value.toLocaleString()}
      </div>
      <div className="font-mono text-[8px] md:text-[9px] uppercase text-zinc-500 tracking-[0.2em] mt-0.5">
        {label}
      </div>
    </div>
  );
}

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1">
      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-primary">
        {label}
      </span>
      <button
        onClick={onRemove}
        className="flex items-center justify-center rounded-full p-0.5 text-primary/70 hover:bg-primary/20 hover:text-primary transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
