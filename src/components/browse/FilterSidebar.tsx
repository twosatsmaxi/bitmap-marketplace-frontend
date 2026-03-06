import type { BrowseFilters, BitmapType, RarityTier } from "@/lib/types";
import { Search } from "lucide-react";

interface FilterSidebarProps {
  filters: BrowseFilters;
  setFilters: React.Dispatch<React.SetStateAction<BrowseFilters>>;
}

const BITMAP_TYPES: BitmapType[] = ["city", "grid", "mondrian", "punk", "palindrome"];
const RARITIES: RarityTier[] = ["common", "uncommon", "rare", "epic", "legendary"];

export default function FilterSidebar({ filters, setFilters }: FilterSidebarProps) {
  const toggleType = (t: BitmapType) => {
    setFilters(prev => ({
      ...prev,
      types: prev.types.includes(t) 
        ? prev.types.filter(x => x !== t)
        : [...prev.types, t]
    }));
  };

  const toggleRarity = (r: RarityTier) => {
    setFilters(prev => ({
      ...prev,
      rarities: prev.rarities.includes(r)
        ? prev.rarities.filter(x => x !== r)
        : [...prev.rarities, r]
    }));
  };

  return (
    <aside className="hidden h-[calc(100vh-var(--header-total))] w-sidebar flex-shrink-0 overflow-y-auto border-r border-[rgba(120,72,18,0.55)] bg-[rgba(7,7,9,0.4)] p-4 hide-scrollbar md:block md:p-6">
      <div className="home-panel sticky top-4 flex flex-col gap-7 px-5 py-5">
        <div className="border-b border-[rgba(120,72,18,0.55)] pb-4">
          <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
            <span className="h-1 w-1 bg-primary"></span> Market filters
          </div>
          <h2 className="font-mono text-lg font-bold uppercase tracking-[0.08em] text-primary">Browse Bitmaps</h2>
        </div>
        
        {/* Search */}
        <div>
          <h3 className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">Search Index</h3>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-zinc-500" />
            </div>
            <input 
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Block number..."
              className="w-full border border-[rgba(120,72,18,0.55)] bg-[rgba(10,10,12,0.92)] px-3 py-2 pl-9 font-mono text-xs uppercase tracking-[0.14em] text-zinc-300 transition-colors placeholder:text-zinc-600 focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <h3 className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">Status</h3>
          <div className="flex flex-col gap-2.5">
            {[
              { id: "listed", label: "Buy Now" },
              { id: "has_offer", label: "Has Offers" },
              { id: "unlisted", label: "Unlisted" }
            ].map(status => (
              <label key={status.id} className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex h-4 w-4 items-center justify-center border border-[rgba(120,72,18,0.55)] bg-[rgba(10,10,12,0.92)] transition-colors group-hover:border-primary/50">
                  <input 
                    type="checkbox"
                    checked={filters.status.includes(status.id as any)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFilters(prev => ({
                        ...prev,
                        status: checked 
                          ? [...prev.status, status.id as any]
                          : prev.status.filter(s => s !== status.id)
                      }));
                    }}
                    className="absolute opacity-0 w-full h-full cursor-pointer"
                  />
                  {filters.status.includes(status.id as any) && (
                    <div className="w-2 h-2 bg-primary"></div>
                  )}
                </div>
                <span className="font-mono text-sm uppercase tracking-[0.08em] text-zinc-400 transition-colors group-hover:text-primary">
                  {status.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Types */}
        <div>
          <h3 className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">Pattern Type</h3>
          <div className="flex flex-col gap-2.5">
            {BITMAP_TYPES.map(type => (
              <label key={type} className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex h-4 w-4 items-center justify-center border border-[rgba(120,72,18,0.55)] bg-[rgba(10,10,12,0.92)] transition-colors group-hover:border-primary/50">
                  <input 
                    type="checkbox"
                    checked={filters.types.includes(type)}
                    onChange={() => toggleType(type)}
                    className="absolute opacity-0 w-full h-full cursor-pointer"
                  />
                  {filters.types.includes(type) && (
                    <div className="w-2 h-2 bg-primary"></div>
                  )}
                </div>
                <span className="font-mono text-sm uppercase tracking-[0.08em] text-zinc-400 capitalize transition-colors group-hover:text-primary">
                  {type}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Rarities */}
        <div>
          <h3 className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">Rarity Level</h3>
          <div className="flex flex-col gap-2.5">
            {RARITIES.map(rarity => (
              <label key={rarity} className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex h-4 w-4 items-center justify-center border border-[rgba(120,72,18,0.55)] bg-[rgba(10,10,12,0.92)] transition-colors group-hover:border-primary/50">
                  <input 
                    type="checkbox"
                    checked={filters.rarities.includes(rarity)}
                    onChange={() => toggleRarity(rarity)}
                    className="absolute opacity-0 w-full h-full cursor-pointer"
                  />
                  {filters.rarities.includes(rarity) && (
                    <div className="w-2 h-2 bg-primary"></div>
                  )}
                </div>
                <span className="font-mono text-sm uppercase tracking-[0.08em] text-zinc-400 capitalize transition-colors group-hover:text-primary">
                  {rarity}
                </span>
              </label>
            ))}
          </div>
        </div>

      </div>
    </aside>
  );
}
