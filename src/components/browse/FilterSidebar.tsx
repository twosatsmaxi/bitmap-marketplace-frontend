import type { BrowseFilters, BitmapType, RarityTier } from "@/lib/types";
import { Search } from "lucide-react";
import { TextInput, Checkbox } from "@/components/ui/Input";

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
          <TextInput
            icon={<Search className="h-4 w-4 text-zinc-500" />}
            type="text"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Block number..."
          />
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
              <Checkbox
                key={status.id}
                checked={filters.status.includes(status.id as any)}
                onChange={(checked) => {
                  setFilters(prev => ({
                    ...prev,
                    status: checked
                      ? [...prev.status, status.id as any]
                      : prev.status.filter(s => s !== status.id)
                  }));
                }}
                label={status.label}
              />
            ))}
          </div>
        </div>

        {/* Types */}
        <div>
          <h3 className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">Pattern Type</h3>
          <div className="flex flex-col gap-2.5">
            {BITMAP_TYPES.map(type => (
              <Checkbox
                key={type}
                checked={filters.types.includes(type)}
                onChange={() => toggleType(type)}
                label={type}
              />
            ))}
          </div>
        </div>

        {/* Rarities */}
        <div>
          <h3 className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">Rarity Level</h3>
          <div className="flex flex-col gap-2.5">
            {RARITIES.map(rarity => (
              <Checkbox
                key={rarity}
                checked={filters.rarities.includes(rarity)}
                onChange={() => toggleRarity(rarity)}
                label={rarity}
              />
            ))}
          </div>
        </div>

      </div>
    </aside>
  );
}
