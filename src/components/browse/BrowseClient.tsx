"use client";

import { useState, useMemo } from "react";
import type { Bitmap, BrowseFilters, BrowseSort } from "@/lib/types";
import FilterSidebar from "./FilterSidebar";
import BitmapCard from "./BitmapCard";
import { Search } from "lucide-react";

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
        <section className="home-panel relative overflow-hidden px-5 py-5 md:px-7 md:py-6 mb-6">
          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="home-eyebrow mb-2">Index Directory</p>
              <h1 className="font-mono text-3xl font-black uppercase tracking-[-0.03em] text-primary md:text-4xl">
                Explore the Protocol
              </h1>
              <p className="mt-2 max-w-md font-mono text-sm leading-6 text-zinc-400">
                Discover and acquire on-chain spatial assets anchored directly to Bitcoin blocks.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 md:gap-3 md:min-w-[300px]">
              <Metric value={total} label="Total Assets" />
              <Metric value={filteredBitmaps.length} label="Results" />
              <Metric value={filters.status.length} label="Filters" />
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[rgba(120,72,18,0.45)]">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-zinc-500">
            <span className="h-1.5 w-1.5 bg-primary/50"></span>
            Showing{" "}
            <span className="font-bold text-zinc-300">{filteredBitmaps.length}</span>{" "}
            results
          </div>

          <select
            className="border border-[rgba(120,72,18,0.55)] bg-[rgba(10,10,12,0.92)] px-3 py-1.5 font-mono text-xs uppercase tracking-[0.14em] text-zinc-300 transition-colors focus:border-primary focus:outline-none hover:border-primary/45 cursor-pointer"
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
          <div className="home-panel flex flex-col items-center justify-center py-24 text-center px-5">
            <div className="mb-4 flex h-16 w-16 items-center justify-center border border-[rgba(120,72,18,0.55)] bg-black/45">
              <Search className="h-6 w-6 text-zinc-500" />
            </div>
            <h3 className="font-mono text-lg font-bold uppercase tracking-[-0.02em] text-primary mb-2">
              No parcels found
            </h3>
            <p className="font-mono text-sm text-zinc-400 max-w-sm">
              Adjust your search query or clear filters to view more assets.
            </p>
            <button
              onClick={() => setFilters({ search: "", status: [], types: [], rarities: [] })}
              className="mt-6 font-mono text-xs uppercase tracking-[0.18em] text-primary border-b border-primary/30 hover:border-primary transition-colors pb-0.5"
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
    <div className="border border-[rgba(120,72,18,0.55)] bg-black/45 px-4 py-3 flex flex-col justify-center">
      <div className="font-mono text-lg font-bold text-primary tracking-tight">{value.toLocaleString()}</div>
      <div className="font-mono text-[9px] uppercase text-zinc-500 tracking-[0.2em] mt-0.5">{label}</div>
    </div>
  );
}
