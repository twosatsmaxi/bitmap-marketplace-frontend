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
    <aside className="w-sidebar flex-shrink-0 border-r border-border h-[calc(100vh-var(--header-total))] overflow-y-auto hide-scrollbar hidden md:block p-4 md:p-6 bg-surface/30">
      <div className="panel-frame pixel-cut p-5 flex flex-col gap-8 sticky top-4">
        <div className="border-b border-border/50 pb-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary mb-2 flex items-center gap-2">
            <span className="w-1 h-1 bg-primary"></span> Matrix DB
          </div>
          <h2 className="font-heading font-bold text-lg tracking-tight text-text-primary">Filter Parcels</h2>
        </div>
        
        {/* Search */}
        <div>
          <h3 className="font-mono font-semibold text-[11px] text-text-secondary mb-3 uppercase tracking-widest">Search Index</h3>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-text-secondary group-focus-within:text-primary transition-colors" />
            </div>
            <input 
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Block number..."
              className="w-full bg-surface-2 border border-border px-3 py-2 pl-9 text-xs font-mono focus:outline-none focus:border-primary transition-colors pixel-cut-sm placeholder:text-text-secondary/50"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <h3 className="font-mono font-semibold text-[11px] text-text-secondary mb-3 uppercase tracking-widest">Status</h3>
          <div className="flex flex-col gap-2.5">
            {[
              { id: "listed", label: "Buy Now" },
              { id: "has_offer", label: "Has Offers" },
              { id: "unlisted", label: "Unlisted" }
            ].map(status => (
              <label key={status.id} className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center w-4 h-4 border border-border bg-surface-2 group-hover:border-primary/50 transition-colors pixel-cut-sm">
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
                <span className="text-sm font-mono text-text-secondary group-hover:text-text-primary transition-colors">
                  {status.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Types */}
        <div>
          <h3 className="font-mono font-semibold text-[11px] text-text-secondary mb-3 uppercase tracking-widest">Pattern Type</h3>
          <div className="flex flex-col gap-2.5">
            {BITMAP_TYPES.map(type => (
              <label key={type} className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center w-4 h-4 border border-border bg-surface-2 group-hover:border-primary/50 transition-colors pixel-cut-sm">
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
                <span className="text-sm font-mono text-text-secondary group-hover:text-text-primary capitalize transition-colors">
                  {type}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Rarities */}
        <div>
          <h3 className="font-mono font-semibold text-[11px] text-text-secondary mb-3 uppercase tracking-widest">Rarity Level</h3>
          <div className="flex flex-col gap-2.5">
            {RARITIES.map(rarity => (
              <label key={rarity} className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center w-4 h-4 border border-border bg-surface-2 group-hover:border-primary/50 transition-colors pixel-cut-sm">
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
                <span className="text-sm font-mono text-text-secondary group-hover:text-text-primary capitalize transition-colors">
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
