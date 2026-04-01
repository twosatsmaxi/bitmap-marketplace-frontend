"use client";

import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import useSWRInfinite from "swr/infinite";
import { Box, Square, X } from "lucide-react";
import BlockCard from "@/components/explore/BlockCard";
import InfiniteScrollTrigger from "@/components/explore/InfiniteScrollTrigger";
import type { BlockMeta } from "@/components/explore/types";
import type { TraitStat, PortfolioBitmapItem } from "@/lib/api";
import { use3DPreference } from "@/hooks/use3DPreference";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 24;
const RENDER_API = "";

interface MultiPortfolioResponse {
  addresses: string[];
  bitmaps: (PortfolioBitmapItem & { owner?: string })[];
  traits: TraitStat[];
  total: number;
  page: number;
  has_more: boolean;
}

interface MultiWalletPortfolioGridProps {
  addresses: string[];
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

function TraitPill({
  trait,
  isActive,
  onClick,
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
      <span className="capitalize">{trait.name.replace(/_/g, " ")}</span>
      <span
        className={cn(
          "px-1.5 py-0.5 rounded text-[10px]",
          isActive ? "bg-black/20" : "bg-black/30"
        )}
      >
        {trait.count}
      </span>
    </button>
  );
}

export default function MultiWalletPortfolioGrid({
  addresses,
}: MultiWalletPortfolioGridProps) {
  const [blockMeta, setBlockMeta] = useState<Map<number, BlockMeta>>(
    new Map()
  );
  const [isometric, toggle3D] = use3DPreference();
  const [activeTrait, setActiveTrait] = useState<string | null>(null);
  const [isFilterTransitioning, setIsFilterTransitioning] = useState(false);
  const prevTraitRef = useRef<string | null>(null);

  // Stable key for SWR based on sorted addresses
  const addressKey = useMemo(
    () => [...addresses].sort().join(","),
    [addresses]
  );

  const getKey = useCallback(
    (
      pageIndex: number,
      previousPageData: MultiPortfolioResponse | null
    ): string | null => {
      if (previousPageData && !previousPageData.has_more) return null;
      // Use a string key that encodes all params — SWR will use it for caching
      const params: Record<string, string> = {
        page: String(pageIndex),
        limit: String(PAGE_SIZE),
        _addresses: addressKey,
      };
      if (activeTrait) params.trait_filter = activeTrait;
      return `/api/portfolio/multi?${new URLSearchParams(params)}`;
    },
    [addressKey, activeTrait]
  );

  const fetcher = async (key: string): Promise<MultiPortfolioResponse> => {
    const url = new URL(key, window.location.origin);
    const page = url.searchParams.get("page") ?? "0";
    const limit = url.searchParams.get("limit") ?? String(PAGE_SIZE);
    const traitFilter = url.searchParams.get("trait_filter");

    const body: Record<string, unknown> = {
      addresses,
      page: Number(page),
      limit: Number(limit),
    };
    if (traitFilter) body.trait_filter = traitFilter;

    const res = await fetch("/api/portfolio/multi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
    return res.json();
  };

  const { data, error, setSize, isValidating, mutate } =
    useSWRInfinite<MultiPortfolioResponse>(getKey, fetcher, {
      revalidateFirstPage: false,
      revalidateOnFocus: false,
      parallel: false,
    });

  const allBitmaps = useMemo(() => {
    if (!data) return [];
    return data.flatMap((page) => page.bitmaps);
  }, [data]);

  const traits = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data[0].traits || [];
  }, [data]);

  const total = useMemo(() => {
    if (!data || data.length === 0) return 0;
    return data[0].total;
  }, [data]);

  const heights = useMemo(
    () => allBitmaps.map((b) => b.block_height),
    [allBitmaps]
  );

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
      for (let i = 0; i < needsFetch.length; i += CONCURRENCY) {
        if (cancelled) return;
        const batch = needsFetch.slice(i, i + CONCURRENCY);
        const batchResults = await Promise.all(
          batch.map(async (height) => {
            const meta = await fetchMeta(height);
            return { height, meta };
          })
        );
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
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heights]);

  const loadMore = useCallback(() => {
    if (isValidating) return;
    if (hasMore) setSize((s) => s + 1);
  }, [isValidating, hasMore, setSize]);

  const isLoading = !data && !error;

  const handleTraitClick = (traitName: string) => {
    const newTrait = activeTrait === traitName ? null : traitName;
    if (newTrait !== activeTrait) {
      setIsFilterTransitioning(true);
      prevTraitRef.current = activeTrait;
      setTimeout(() => {
        setActiveTrait(newTrait);
      }, 50);
    }
  };

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
      {/* Total count */}
      {total > 0 && (
        <div className="br-card -mt-3 p-3 md:-mt-4 md:p-5">
          <span className="border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.035)] rounded px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-400 md:text-[10px]">
            <span className="text-primary">{total}</span> bitmaps
          </span>
        </div>
      )}

      {/* Trait Filter Pills */}
      {traits.length > 0 && (
        <div className="mb-4 md:mb-6">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-mono text-xs uppercase tracking-wider text-zinc-500">
              Traits
            </h3>
            {activeTrait && (
              <button
                onClick={clearFilter}
                className="inline-flex items-center gap-1 text-xs text-primary transition-colors hover:text-primary/80"
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

      {/* Grid */}
      <div
        className={cn(
          "grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4",
          "transition-all duration-200 ease-out",
          isFilterTransitioning
            ? "scale-[0.98] opacity-0"
            : "scale-100 opacity-100"
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
          Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="aspect-square animate-pulse border border-[rgba(120,72,18,0.3)] bg-black/20"
            />
          ))}

        {heights.length === 0 && !isLoading && (
          <div className="col-span-full rounded-lg border border-dashed border-[rgba(255,255,255,0.08)] bg-black/20 py-16 text-center md:py-20">
            <p className="font-mono text-sm uppercase tracking-widest text-zinc-500">
              No bitmaps found
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
        <div className="py-4 text-center">
          <p className="font-mono text-sm text-red-400">
            Failed to load portfolio.{" "}
            <button
              onClick={() => mutate()}
              className="underline hover:text-red-300"
            >
              Retry
            </button>
          </p>
        </div>
      )}

      {/* Floating 3D Toggle */}
      <button
        onClick={toggle3D}
        className={cn(
          "fixed bottom-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg border shadow-lg transition-all duration-200",
          "border-[rgba(255,255,255,0.1)] bg-bg/90 backdrop-blur-sm hover:border-[rgba(247,162,59,0.5)]",
          isometric &&
            "border-[rgba(247,162,59,0.6)] bg-[rgba(247,162,59,0.15)] text-primary shadow-[0_0_15px_rgba(247,162,59,0.3)]"
        )}
        aria-label={isometric ? "Switch to 2D view" : "Switch to 3D view"}
        title={isometric ? "Switch to 2D view" : "Switch to 3D view"}
      >
        {isometric ? (
          <Square className="h-5 w-5 text-primary" strokeWidth={2} />
        ) : (
          <Box className="h-5 w-5 text-primary" strokeWidth={2} />
        )}
      </button>
    </>
  );
}
