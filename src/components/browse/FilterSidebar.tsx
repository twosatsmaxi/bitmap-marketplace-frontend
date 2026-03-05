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
    <aside className="w-sidebar flex-shrink-0 border-r border-border h-[calc(100vh-var(--header-total))] overflow-y-auto hide-scrollbar hidden md:block p-6">
      <div className="flex flex-col gap-8">
        
        {/* Search */}
        <div>
          <h3 className="font-semibold text-sm mb-3">Search</h3>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-text-secondary" />
            </div>
            <input 
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Block number..."
              className="w-full bg-bg border border-border rounded px-3 py-2 pl-9 text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <h3 className="font-semibold text-sm mb-3">Status</h3>
          <div className="flex flex-col gap-2">
            {[
              { id: "listed", label: "Buy Now" },
              { id: "has_offer", label: "Has Offers" },
              { id: "unlisted", label: "Unlisted" }
            ].map(status => (
              <label key={status.id} className="flex items-center gap-2 cursor-pointer">
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
                  className="rounded border-border bg-bg text-primary focus:ring-primary focus:ring-offset-bg accent-primary"
                />
                <span className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                  {status.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Types */}
        <div>
          <h3 className="font-semibold text-sm mb-3">Pattern Type</h3>
          <div className="flex flex-col gap-2">
            {BITMAP_TYPES.map(type => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={filters.types.includes(type)}
                  onChange={() => toggleType(type)}
                  className="rounded border-border bg-bg text-primary focus:ring-primary focus:ring-offset-bg accent-primary"
                />
                <span className="text-sm text-text-secondary hover:text-text-primary capitalize transition-colors">
                  {type}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Rarities */}
        <div>
          <h3 className="font-semibold text-sm mb-3">Rarity</h3>
          <div className="flex flex-col gap-2">
            {RARITIES.map(rarity => (
              <label key={rarity} className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={filters.rarities.includes(rarity)}
                  onChange={() => toggleRarity(rarity)}
                  className="rounded border-border bg-bg text-primary focus:ring-primary focus:ring-offset-bg accent-primary"
                />
                <span className="text-sm text-text-secondary hover:text-text-primary capitalize transition-colors">
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
