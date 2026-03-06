"use client";

import { useState, useMemo } from "react";
import type { Bitmap, BrowseFilters, BrowseSort } from "@/lib/types";
import FilterSidebar from "./FilterSidebar";
import BitmapCard from "./BitmapCard";
import { Terminal, LayoutGrid, Search } from "lucide-react";

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

  // Client-side filtering for demo/mock purposes
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

  return (
    <div className="flex max-w-[1600px] mx-auto">
      <FilterSidebar filters={filters} setFilters={setFilters} />
      
      <div className="flex-1 p-4 md:p-6 min-h-[calc(100vh-var(--header-total))]">
        <section className="panel-frame pixel-cut p-6 mb-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-5 pointer-events-none">
            <LayoutGrid className="w-64 h-64 -mt-16 -mr-16" />
          </div>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between relative z-10">
            <div>
              <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-primary mb-2 flex items-center gap-2">
                <Terminal className="w-3 h-3" />
                Index Directory
              </p>
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-primary leading-tight tracking-tight">
                Explore the Protocol
              </h1>
              <p className="text-text-secondary text-sm mt-2 max-w-md">
                Discover and acquire on-chain spatial assets anchored directly to Bitcoin blocks.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 md:gap-3 min-w-[300px]">
              <Metric value={total} label="Total Assets" />
              <Metric value={filteredBitmaps.length} label="Query Results" />
              <Metric value={filters.status.length} label="Active Filters" />
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/50">
          <div className="text-xs font-mono text-text-secondary uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-primary/50 block"></span>
            Showing <span className="text-text-primary font-bold">{filteredBitmaps.length}</span> results
          </div>
          
          <select 
            className="bg-surface border border-border px-3 py-1.5 text-xs font-mono uppercase tracking-wide focus:outline-none focus:border-primary cursor-pointer pixel-cut-sm hover:border-text-secondary transition-colors text-text-primary"
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
        </div>

        {filteredBitmaps.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
            {filteredBitmaps.map(bitmap => (
              <BitmapCard key={bitmap.id} bitmap={bitmap} />
            ))}
          </div>
        ) : (
          <div className="panel-frame pixel-cut flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-surface-2 border border-border flex items-center justify-center mb-4 pixel-cut">
              <Search className="w-6 h-6 text-text-secondary" />
            </div>
            <h3 className="text-lg font-heading font-bold mb-2">No parcels found</h3>
            <p className="text-text-secondary text-sm max-w-sm">
              Adjust your search query or clear filters to view more assets.
            </p>
            <button 
              onClick={() => setFilters({ search: "", status: [], types: [], rarities: [] })}
              className="mt-6 text-primary border-b border-primary/30 hover:border-primary font-mono text-xs transition-colors uppercase tracking-widest pb-0.5"
            >
              Reset Query
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-surface-2 border border-border px-4 py-3 flex flex-col justify-center pixel-cut-sm relative overflow-hidden group">
      <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
      <div className="font-mono text-lg md:text-xl font-bold text-text-primary tracking-tight relative z-10">{value.toLocaleString()}</div>
      <div className="font-mono text-[9px] uppercase text-text-secondary tracking-[0.2em] mt-0.5 relative z-10">{label}</div>
    </div>
  );
}
