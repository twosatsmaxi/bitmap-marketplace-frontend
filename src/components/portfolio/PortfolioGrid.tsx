"use client";

import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import useSWRInfinite from "swr/infinite";
import { Box, Square, X } from "lucide-react";
import BlockCard from "@/components/explore/BlockCard";
import InfiniteScrollTrigger from "@/components/explore/InfiniteScrollTrigger";
import type { BlockMeta } from "@/components/explore/types";
import type { PortfolioResponse, TraitStat } from "@/lib/api";
import { use3DPreference } from "@/hooks/use3DPreference";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 24;
const RENDER_API = "";

interface PortfolioGridProps {
  address: string;
  initialData: PortfolioResponse | null;
}

// Module-level meta cache
const metaCache = new Map<number, BlockMeta | null>();

async function fetchMeta(height: number): Promise<BlockMeta | null> {
  if (metaCache.has(height)) return metaCache.get(height) ?? null;
  try {
    const res = await fetch(`${RENDER_API}/api/explore/blocks/${height}/meta`);
    if (!res.ok) {
      metaCache.set(height, null);
      return null;
    }
    const data: BlockMeta = await res.json();
    metaCache.set(height, data);
    return data;
  } catch {
    metaCache.set(height, null);
    return null;
  }
}

// Trait pill component
function TraitPill({ 
  trait, 
  isActive, 
  onClick 
}: { 
  trait: TraitStat; 
  isActive: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs transition-all",
        "border hover:scale-105 active:scale-95",
        isActive
          ? "bg-primary text-black border-primary font-bold"
          : "bg-[rgba(120,72,18,0.2)] text-primary border-[rgba(120,72,18,0.4)] hover:border-primary"
      )}
    >
      <span className="capitalize">{trait.name.replace(/_/g, ' ')}</span>
      <span className={cn(
        "px-1.5 py-0.5 rounded text-[10px]",
        isActive ? "bg-black/20" : "bg-black/30"
      )}>
        {trait.count}
      </span>
    </button>
  );
}

export default function PortfolioGrid({ address, initialData }: PortfolioGridProps) {
  const [blockMeta, setBlockMeta] = useState<Map<number, BlockMeta>>(new Map());
  const [isometric, toggle3D] = use3DPreference();
  const [activeTrait, setActiveTrait] = useState<string | null>(null);
  const [isFilterTransitioning, setIsFilterTransitioning] = useState(false);
  const prevTraitRef = useRef<string | null>(null);

  const getKey = useCallback(
    (pageIndex: number, previousPageData: PortfolioResponse | null): string | null => {
      if (previousPageData && !previousPageData.has_more) return null;
      const params = new URLSearchParams({ page: String(pageIndex), limit: String(PAGE_SIZE) });
      if (activeTrait) params.set('trait_filter', activeTrait);
      return `/api/portfolio/${address}?${params}`;
    },
    [address, activeTrait]
  );

  const fetcher = async (url: string): Promise<PortfolioResponse> => {
    const base = process.env.NEXT_PUBLIC_BITMAP_INDEX_API_BASE || "";
    const res = await fetch(`${base}${url}`);
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
    return res.json();
  };

  const { data, error, setSize, isValidating, mutate } = useSWRInfinite<PortfolioResponse>(
    getKey,
    fetcher,
    {
      fallbackData: initialData ? [initialData] : undefined,
      revalidateFirstPage: false,
      revalidateOnFocus: false,
      parallel: false,
    }
  );

  const allBitmaps = useMemo(() => {
    if (!data) return [];
    return data.flatMap((page) => page.bitmaps);
  }, [data]);

  // Get traits from first page (they're the same for all pages)
  const traits = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data[0].traits || [];
  }, [data]);

  const heights = useMemo(() => allBitmaps.map((b) => b.block_height), [allBitmaps]);

  const hasMore = useMemo(() => {
    if (!data || data.length === 0) return true;
    const lastPage = data[data.length - 1];
    return lastPage.has_more;
  }, [data]);

  // Load meta for visible blocks
  useEffect(() => {
    const missing = heights.filter((h) => !blockMeta.has(h));
    if (missing.length === 0) return;

    const fromCache: { height: number; meta: BlockMeta }[] = [];
    const needsFetch: number[] = [];
    for (const h of missing) {
      const cached = metaCache.get(h);
      if (cached) fromCache.push({ height: h, meta: cached });
      else if (!metaCache.has(h)) needsFetch.push(h);
    }

    if (fromCache.length > 0) {
      setBlockMeta((prev) => {
        const next = new Map(prev);
        fromCache.forEach(({ height, meta }) => next.set(height, meta));
        return next;
      });
    }

    if (needsFetch.length === 0) return;

    let cancelled = false;
    const CONCURRENCY = 6;
    async function loadMeta() {
      const results: { height: number; meta: BlockMeta | null }[] = [];
      for (let i = 0; i < needsFetch.length; i += CONCURRENCY) {
        if (cancelled) return;
        const batch = needsFetch.slice(i, i + CONCURRENCY);
        const batchResults = await Promise.all(
          batch.map(async (height) => {
            const meta = await fetchMeta(height);
            return { height, meta };
          })
        );
        results.push(...batchResults);
        // Update state progressively so cards render as meta arrives
        if (!cancelled) {
          setBlockMeta((prev) => {
            const next = new Map(prev);
            batchResults.forEach(({ height, meta }) => {
              if (meta) next.set(height, meta);
            });
            return next;
          });
        }
      }
    }
    loadMeta();
    return () => { cancelled = true; };
  }, [heights, blockMeta]);

  const loadMore = useCallback(() => {
    if (isValidating) return;
    if (hasMore) setSize((s) => s + 1);
  }, [isValidating, hasMore, setSize]);

  const isLoading = !data && !error;

  // Handle filter change with visual transition
  const handleTraitClick = (traitName: string) => {
    const newTrait = activeTrait === traitName ? null : traitName;
    
    // Only animate if actually changing
    if (newTrait !== activeTrait) {
      setIsFilterTransitioning(true);
      prevTraitRef.current = activeTrait;
      
      // Small delay to allow fade-out before state change triggers data fetch
      setTimeout(() => {
        setActiveTrait(newTrait);
      }, 50);
    }
  };

  // Clear transition state when data loads
  useEffect(() => {
    if (!isValidating && isFilterTransitioning) {
      const timer = setTimeout(() => setIsFilterTransitioning(false), 50);
      return () => clearTimeout(timer);
    }
  }, [isValidating, isFilterTransitioning]);

  const clearFilter = () => {
    if (activeTrait) {
      setIsFilterTransitioning(true);
      prevTraitRef.current = activeTrait;
      setTimeout(() => {
        setActiveTrait(null);
      }, 50);
    }
  };

  return (
    <>
      {/* Trait Filter Pills */}
      {traits.length > 0 && (
        <div className="mb-4 md:mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-mono text-xs uppercase tracking-wider text-zinc-500">
              Traits
            </h3>
            {activeTrait && (
              <button
                onClick={clearFilter}
                className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {traits.map((trait) => (
              <TraitPill
                key={trait.name}
                trait={trait}
                isActive={activeTrait === trait.name}
                onClick={() => handleTraitClick(trait.name)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Grid with fade transition on filter change */}
      <div 
        className={cn(
          "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4",
          "transition-all duration-200 ease-out",
          isFilterTransitioning ? "opacity-0 scale-[0.98]" : "opacity-100 scale-100"
        )}
      >
        {heights.map((height, index) => (
          <BlockCard
            key={height}
            height={height}
            meta={blockMeta.get(height)}
            index={index}
            isometric={isometric}
          />
        ))}

        {isLoading &&
          Array.from({ length: 8 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="br-card flex flex-col overflow-hidden p-0">
              <div className="flex items-center px-2.5 py-1.5 md:px-3 md:py-2">
                <div className="h-3 w-24 rounded animate-shimmer" />
              </div>
              <div className="relative mx-2 aspect-square rounded-lg bg-[#090c11] overflow-hidden">
                <div className="absolute inset-0 animate-shimmer" />
              </div>
              <div className="flex flex-col gap-0.5 md:gap-1 px-2.5 py-2 md:px-3 md:py-3">
                <div className="h-2.5 w-16 rounded animate-shimmer" />
              </div>
            </div>
          ))}

        {heights.length === 0 && !isLoading && (
          <div className="col-span-full py-16 md:py-20 text-center border border-dashed border-[rgba(255,255,255,0.08)] bg-black/20 rounded-lg">
            <p className="font-mono text-sm text-zinc-500 uppercase tracking-widest">
              No bitmaps found for this address
            </p>
          </div>
        )}
      </div>

      <InfiniteScrollTrigger
        onIntersect={loadMore}
        hasMore={hasMore}
        isLoading={isValidating}
      />

      {error && (
        <div className="text-center py-4">
          <p className="font-mono text-sm text-red-400">
            Failed to load portfolio.{" "}
            <button onClick={() => mutate()} className="underline hover:text-red-300">
              Retry
            </button>
          </p>
        </div>
      )}

      {/* Floating 3D Toggle */}
      <button
        onClick={toggle3D}
        className={cn(
          "fixed bottom-4 right-4 z-50 flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200 shadow-lg",
          "bg-bg/90 backdrop-blur-sm border-[rgba(255,255,255,0.1)] hover:border-[rgba(247,162,59,0.5)]",
          isometric && "border-[rgba(247,162,59,0.6)] bg-[rgba(247,162,59,0.15)] text-primary shadow-[0_0_15px_rgba(247,162,59,0.3)]"
        )}
        aria-label={isometric ? "Switch to 2D view" : "Switch to 3D view"}
        title={isometric ? "Switch to 2D view" : "Switch to 3D view"}
      >
        {/* Show the icon of what you'll get when clicked */}
        {isometric ? (
          <Square className="h-5 w-5 text-primary" strokeWidth={2} />
        ) : (
          <Box className="h-5 w-5 text-primary" strokeWidth={2} />
        )}
      </button>
    </>
  );
}
