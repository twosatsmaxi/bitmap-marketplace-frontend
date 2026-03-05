"use client";

import { useState, useMemo } from "react";
import type { Bitmap, BrowseFilters, BrowseSort } from "@/lib/types";
import FilterSidebar from "./FilterSidebar";
import BitmapCard from "./BitmapCard";

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
      
      <div className="flex-1 p-6 min-h-[calc(100vh-var(--header-total))]">
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-text-secondary">
            Showing <span className="text-text-primary font-medium">{filteredBitmaps.length}</span> results
          </div>
          
          <select 
            className="bg-surface border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-primary cursor-pointer"
            value={`${sort.field}-${sort.direction}`}
            onChange={(e) => {
              const [field, direction] = e.target.value.split("-") as [BrowseSort["field"], BrowseSort["direction"]];
              setSort({ field, direction });
            }}
          >
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="blockNumber-asc">Block: Low to High</option>
            <option value="blockNumber-desc">Block: High to Low</option>
            <option value="recent-desc">Recently Listed</option>
          </select>
        </div>

        {filteredBitmaps.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBitmaps.map(bitmap => (
              <BitmapCard key={bitmap.id} bitmap={bitmap} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl text-text-secondary">🔍</span>
            </div>
            <h3 className="text-lg font-medium mb-2">No bitmaps found</h3>
            <p className="text-text-secondary max-w-sm">
              Try adjusting your filters or search query to find what you&apos;re looking for.
            </p>
            <button 
              onClick={() => setFilters({ search: "", status: [], types: [], rarities: [] })}
              className="mt-6 text-primary hover:text-primary/80 font-medium text-sm transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
