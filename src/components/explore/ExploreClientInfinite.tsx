"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import useSWRInfinite from "swr/infinite";
import { Zap, Box } from "lucide-react";
import BlockCard from "./BlockCard";
import BlockSearch from "./BlockSearch";
import CollectionFilterPanel from "./CollectionFilterPanel";
import InfiniteScrollTrigger from "./InfiniteScrollTrigger";
import type {
  BlockMeta,
  BlockRendered,
  CollectionFilterMeta,
  InterestingBlock,
} from "./types";
import { cn } from "@/lib/utils";

const RENDER_API = "";
const GRID_SIZE = 12;

const INTERESTING_BLOCKS: InterestingBlock[] = [
  { label: "Genesis", height: 0 },
  { label: "Halving I", height: 210_000 },
  { label: "Halving II", height: 420_000 },
  { label: "Halving III", height: 630_000 },
  { label: "Halving IV", height: 840_000 },
];

type FilterCategory = "historical" | "punk" | "numeric";

interface CategorizedFilterMeta extends CollectionFilterMeta {
  category: FilterCategory;
}

const COLLECTION_FILTER_LAYOUT: CategorizedFilterMeta[] = [
  { id: "pizza", label: "Pizza Block", priority: 1, highlight: "The 10,000 BTC Pizza Transaction", category: "historical" },
  { id: "patoshi", label: "Patoshi", priority: 2, highlight: "Early Patoshi Pattern Miner Blocks", category: "historical" },
  { id: "nakamoto", label: "Nakamoto", priority: 3, highlight: "Blocks Mined by Satoshi Nakamoto", category: "historical" },
  { id: "punks", label: "Punks", priority: 4, highlight: "Blocks Rendered as Pixel Avatars", category: "punk" },
  { id: "perfect-punk", label: "Perfect Punk", priority: 5, highlight: "Flawlessly Formed Avatar Patterns", category: "punk" },
  { id: "pristine-punk", label: "Pristine Punk", priority: 6, highlight: "Highest Fidelity Avatar Rendering", category: "punk" },
  { id: "same-digits", label: "Same Digits", priority: 7, highlight: "Block Height with Identical Digits", category: "numeric" },
  { id: "palindrome", label: "Palindrome", priority: 8, highlight: "Block Height Reads Same Backwards", category: "numeric" },
  { id: "sub-100k", label: "Sub 100k", priority: 9, highlight: "First 100,000 Historic Blocks", category: "numeric" },
  { id: "billionaire", label: "Billionaire", priority: 10, highlight: "Blocks with Massive BTC Activity", category: "numeric" },
];

// Module-level meta cache
const metaCache = new Map<number, BlockMeta>();

// Persist navigation state
let savedAnchorHeight: number | null = null;

if (savedAnchorHeight !== null && savedAnchorHeight < 0) {
  savedAnchorHeight = null;
}

interface FetchResponse {
  heights: number[];
  total?: number;
  hasMore?: boolean;
}

async function fetchMeta(height: number): Promise<BlockMeta | undefined> {
  if (metaCache.has(height)) return metaCache.get(height);
  try {
    const res = await fetch(`${RENDER_API}/api/explore/blocks/${height}/meta`);
    if (!res.ok) return undefined;
    const data: BlockMeta = await res.json();
    metaCache.set(height, data);
    return data;
  } catch {
    return undefined;
  }
}

export default function ExploreClientInfinite({ latestBlock }: { latestBlock: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlFilter = searchParams.get("filter");
  const urlAnchor = searchParams.get("anchor");

  const [activeFilter, setActiveFilter] = useState<string | null>(urlFilter);
  const [isometric, setIsometric] = useState(false);
  const [blockMeta, setBlockMeta] = useState<Map<number, BlockMeta>>(new Map());

  // Initialize anchor from URL or default
  const [anchorHeight, setAnchorHeight] = useState(() => {
    const halvingIV = 840_000;
    if (urlAnchor) {
      const parsed = parseInt(urlAnchor, 10);
      if (!isNaN(parsed)) return Math.max(0, Math.min(parsed, latestBlock));
    }
    const saved = savedAnchorHeight ?? halvingIV;
    return Math.max(0, Math.min(saved, latestBlock));
  });

  // Persist state
  useEffect(() => { savedAnchorHeight = anchorHeight; }, [anchorHeight]);

  // Sync to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (activeFilter) {
      params.set("filter", activeFilter);
      params.delete("anchor");
    } else {
      params.delete("filter");
      params.set("anchor", anchorHeight.toString());
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [activeFilter, anchorHeight, pathname, router, searchParams]);

  // SWR Infinite fetcher
  const getKey = useCallback(
    (pageIndex: number, previousPageData: FetchResponse | null): string | null => {
      if (activeFilter) {
        // Filter mode: stop if no more data
        if (previousPageData && !previousPageData.hasMore) return null;
        return `/api/explore/blocks?filter=${activeFilter}&page=${pageIndex}&limit=${GRID_SIZE}`;
      } else {
        // Normal mode: sequential blocks
        const startHeight = anchorHeight + pageIndex * GRID_SIZE;
        if (startHeight > latestBlock) return null;
        return `/api/explore/blocks?start=${startHeight}&limit=${GRID_SIZE}`;
      }
    },
    [activeFilter, anchorHeight, latestBlock]
  );

  const fetcher = async (url: string): Promise<FetchResponse> => {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  };

  const {
    data,
    error,
    size,
    setSize,
    isValidating,
    mutate,
  } = useSWRInfinite<FetchResponse>(getKey, fetcher, {
    revalidateFirstPage: false,
    revalidateOnFocus: false,
    parallel: false,
  });

  // Flatten all pages
  const allHeights = useMemo(() => {
    if (!data) return [];
    return data.flatMap((page) => page.heights);
  }, [data]);

  // Build blocks with meta
  const blocks: BlockRendered[] = useMemo(() => {
    return allHeights.map((height) => ({
      height,
      status: "idle" as const,
      meta: blockMeta.get(height),
    }));
  }, [allHeights, blockMeta]);

  // Check if more data available
  const hasMore = useMemo(() => {
    if (!data || data.length === 0) return true;
    const lastPage = data[data.length - 1];
    return lastPage.hasMore ?? lastPage.heights.length === GRID_SIZE;
  }, [data]);

  // Load meta for new blocks
  useEffect(() => {
    const heightsNeedingMeta = allHeights.filter((h) => !blockMeta.has(h) && !metaCache.has(h));
    if (heightsNeedingMeta.length === 0) return;

    let cancelled = false;

    async function loadMeta() {
      const results = await Promise.all(
        heightsNeedingMeta.map(async (height) => {
          const meta = await fetchMeta(height);
          return { height, meta };
        })
      );

      if (cancelled) return;

      setBlockMeta((prev) => {
        const next = new Map(prev);
        results.forEach(({ height, meta }) => {
          if (meta) next.set(height, meta);
        });
        return next;
      });
    }

    loadMeta();

    return () => { cancelled = true; };
  }, [allHeights, blockMeta]);

  // Reset when filter or anchor changes
  useEffect(() => {
    setBlockMeta(new Map());
  }, [activeFilter, anchorHeight]);

  // Throttled load more to prevent rate limiting
  const loadMore = useCallback(() => {
    if (!isValidating && hasMore) {
      setSize((s) => s + 1);
    }
  }, [isValidating, hasMore, setSize]);

  // Debug: log when loading state changes
  useEffect(() => {
    if (isValidating) {
      console.log(`[Explore] Loading page ${size}, total loaded: ${allHeights.length}`);
    }
  }, [isValidating, size, allHeights.length]);

  const jumpTo = (target: number) => {
    setActiveFilter(null);
    const newAnchor = Math.max(0, Math.min(target, latestBlock));
    setAnchorHeight(newAnchor);
    setBlockMeta(new Map());
    mutate(undefined, { revalidate: true });
  };

  const toggleFilter = (id: string) => {
    if (activeFilter === id) {
      setActiveFilter(null);
    } else {
      setActiveFilter(id);
    }
    setBlockMeta(new Map());
    mutate(undefined, { revalidate: true });
  };

  const isLoading = !data && !error;
  const loadedCount = allHeights.length;
  const totalCount = data?.[0]?.total;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 md:gap-4 px-3 md:px-4 pb-12 pt-3 md:pt-4">
      {/* Header panel */}
      <div className="br-card p-3 md:p-5">
        <div className="flex flex-col gap-2 md:gap-3">
          <div className="flex items-center gap-2 md:gap-4">
            <h1 className="font-mono text-lg font-black uppercase tracking-[0.1em] text-primary md:text-2xl">
              Bitmap Explorer
            </h1>
            <div className="hidden sm:block">
              <BlockSearch onSearch={jumpTo} latestBlock={latestBlock} />
            </div>
            <span className="ml-auto border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.035)] rounded px-2 py-0.5 font-mono text-[9px] md:text-[10px] uppercase tracking-[0.16em] md:tracking-[0.2em] text-zinc-400">
              Tip <span className="text-primary">#{latestBlock.toLocaleString()}</span>
            </span>
          </div>

          <div className="sm:hidden">
            <BlockSearch onSearch={jumpTo} latestBlock={latestBlock} />
          </div>

          <p className="font-mono text-[11px] md:text-xs text-zinc-500 tracking-wide">
            Every Bitcoin block is a bitmap. be the bitmap 🟧
            {totalCount !== undefined && activeFilter && (
              <span className="ml-2 text-primary">
                ({loadedCount.toLocaleString()} / {totalCount.toLocaleString()})
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Collections filter and legendary links */}
      <div className="flex flex-col gap-2 md:gap-3">
        <div className="flex items-center gap-2 md:gap-3">
          {/* Left: Legendary scrollable section */}
          <div className="flex flex-1 items-center gap-2 md:gap-3 min-w-0">
            <div className="flex flex-shrink-0 items-center justify-center w-9 h-9 md:w-auto md:h-auto rounded-md border border-[rgba(247,147,26,0.3)] bg-[rgba(247,147,26,0.1)] md:px-3 md:py-2">
              <Zap className="h-4 w-4 text-primary" fill="currentColor" />
              <span className="hidden md:inline font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary ml-2">
                Legendary
              </span>
            </div>

            <div className="relative flex-1 overflow-hidden">
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 z-10 bg-gradient-to-l from-[rgba(9,9,11,1)] to-transparent" />
              
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pr-6">
                {INTERESTING_BLOCKS.map((b) => (
                  <button
                    key={b.height}
                    onClick={() => jumpTo(b.height)}
                    className="flex-shrink-0 rounded border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] px-2 py-2 md:px-3 md:py-2 font-mono text-[10px] uppercase tracking-[0.1em] md:tracking-[0.14em] text-zinc-400 transition-all hover:border-[rgba(247,162,59,0.5)] hover:bg-[rgba(247,162,59,0.08)] hover:text-primary active:scale-95"
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: 3D toggle */}
          <div className="flex flex-shrink-0 items-center gap-1.5 md:gap-2">
            <button
              onClick={() => setIsometric((v) => !v)}
              className={cn(
                "br-btn flex items-center justify-center w-9 h-9 md:w-auto md:h-auto md:px-3 md:py-2 transition-colors",
                isometric && "border-[rgba(247,162,59,0.5)] bg-[rgba(247,162,59,0.08)] text-primary"
              )}
              aria-label="Toggle 3D isometric view"
            >
              <Box className="h-4 w-4" />
              <span className="hidden md:inline ml-1.5 text-xs">3D</span>
            </button>
          </div>
        </div>

        <CollectionFilterPanel
          collections={COLLECTION_FILTER_LAYOUT}
          activeFilter={activeFilter}
          onToggle={toggleFilter}
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {blocks.map((b) => (
          <BlockCard
            key={b.height}
            height={b.height}
            meta={b.meta}
            listingStatus={b.listingStatus}
            price={b.price}
            isometric={isometric}
          />
        ))}
        
        {/* Skeleton loaders while loading */}
        {isLoading && (
          Array.from({ length: GRID_SIZE }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="aspect-square border border-[rgba(120,72,18,0.3)] bg-black/20 animate-pulse"
            />
          ))
        )}

        {blocks.length === 0 && !isLoading && (
          <div className="col-span-full py-16 md:py-20 text-center border border-dashed border-[rgba(255,255,255,0.08)] bg-black/20 rounded-lg">
            <p className="font-mono text-sm text-zinc-500 uppercase tracking-widest">
              No matching bitmaps found
            </p>
          </div>
        )}
      </div>

      {/* Infinite scroll trigger */}
      <InfiniteScrollTrigger
        onIntersect={loadMore}
        hasMore={hasMore}
        isLoading={isValidating}
      />

      {error && (
        <div className="text-center py-4">
          <p className="font-mono text-sm text-red-400">
            Failed to load bitmaps. <button onClick={() => mutate()} className="underline hover:text-red-300">Retry</button>
          </p>
        </div>
      )}
    </div>
  );
}
