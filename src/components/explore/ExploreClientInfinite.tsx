"use client";

import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import useSWRInfinite from "swr/infinite";
import { Zap, Box, Square } from "lucide-react";
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
import { cn, abbreviateNumber } from "@/lib/utils";
import { use3DPreference } from "@/hooks/use3DPreference";

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

// Module-level meta cache (null = tried but failed)
const META_CACHE_MAX = 500;
const metaCache = new Map<number, BlockMeta | null>();

// Persist navigation state
let savedAnchorHeight: number | null = null;

interface FetchResponse {
  heights: number[];
  total?: number;
  hasMore?: boolean;
}

function evictMetaCache() {
  if (metaCache.size <= META_CACHE_MAX) return;
  const toDelete = metaCache.size - META_CACHE_MAX;
  const keys = metaCache.keys();
  for (let i = 0; i < toDelete; i++) {
    const { value } = keys.next();
    if (value !== undefined) metaCache.delete(value);
  }
}

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
    evictMetaCache();
    return data;
  } catch {
    metaCache.set(height, null);
    return null;
  }
}

function buildHeights(anchor: number, latest: number, count: number): number[] {
  return Array.from({ length: count }, (_, i) =>
    Math.min(Math.max(anchor + i, 0), latest)
  );
}

export default function ExploreClientInfinite({ latestBlock }: { latestBlock: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Prevent hydration mismatch - wait for mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const urlFilter = searchParams.get("filter");

  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [isometric, toggle3D] = use3DPreference();
  const [blockMeta, setBlockMeta] = useState<Map<number, BlockMeta>>(new Map());
  
  // Normal mode: track how many "pages" of blocks to show
  const [normalPageCount, setNormalPageCount] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filter mode: track current page for navigation
  const [visiblePageIndex, setVisiblePageIndex] = useState(0);

  // Initialize anchor from URL or default (only after mount to avoid hydration mismatch)
  const [anchorHeight, setAnchorHeight] = useState(() => {
    const halvingIV = 840_000;
    return Math.max(0, Math.min(halvingIV, latestBlock));
  });
  
  // Sync with URL after mount
  useEffect(() => {
    if (urlFilter) {
      setActiveFilter(urlFilter);
    }
    // Check for anchor in URL
    const urlAnchor = searchParams.get("anchor");
    if (urlAnchor) {
      const parsed = parseInt(urlAnchor, 10);
      if (!isNaN(parsed)) {
        setAnchorHeight(Math.max(0, Math.min(parsed, latestBlock)));
      }
    } else if (savedAnchorHeight !== null) {
      setAnchorHeight(Math.max(0, Math.min(savedAnchorHeight, latestBlock)));
    }
  }, [urlFilter, searchParams, latestBlock]);

  // Persist state
  useEffect(() => { savedAnchorHeight = anchorHeight; }, [anchorHeight]);

  // Sync filter to URL (only when activeFilter changes)
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const currentFilter = params.get("filter");
    if (currentFilter === activeFilter) return;
    if (activeFilter) {
      params.set("filter", activeFilter);
    } else {
      params.delete("filter");
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [activeFilter, pathname, router, searchParams]);

  // SWR Infinite fetcher - ONLY for filter mode
  const getKey = useCallback(
    (pageIndex: number, previousPageData: FetchResponse | null): string | null => {
      if (!activeFilter) return null; // No API calls in normal mode
      // Stop if API explicitly says no more data, or returned fewer than requested
      if (previousPageData && (previousPageData.hasMore === false || previousPageData.heights.length < GRID_SIZE)) return null;
      return `/api/explore/blocks?filter=${activeFilter}&page=${pageIndex}&limit=${GRID_SIZE}`;
    },
    [activeFilter]
  );

  const fetcher = async (url: string): Promise<FetchResponse> => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
    return res.json();
  };

  const {
    data,
    error,
    setSize,
    isValidating,
    mutate,
  } = useSWRInfinite<FetchResponse>(getKey, fetcher, {
    revalidateFirstPage: false,
    revalidateOnFocus: false,
    parallel: false,
    errorRetryCount: 3,
    onErrorRetry: (err, _key, _config, revalidate, { retryCount }) => {
      // Don't retry on 429 (rate limited)
      if (/\b429\b/.test(err.message)) return;
      if (retryCount >= 3) return;
      // Exponential backoff: 5s, 10s, 20s
      setTimeout(() => revalidate({ retryCount }), Math.min(5000 * 2 ** retryCount, 30000));
    },
  });

  // Generate heights for normal mode (no API calls)
  const normalHeights = useMemo(() => {
    if (activeFilter) return [];
    const totalBlocks = normalPageCount * GRID_SIZE;
    return buildHeights(anchorHeight, latestBlock, totalBlocks);
  }, [activeFilter, anchorHeight, latestBlock, normalPageCount]);

  // Flatten filter mode pages
  const filterHeights = useMemo(() => {
    if (!activeFilter || !data) return [];
    return data.flatMap((page) => page.heights);
  }, [activeFilter, data]);

  // Use appropriate heights based on mode
  const allHeights = activeFilter ? filterHeights : normalHeights;

  // Build blocks with meta
  const blocks: BlockRendered[] = useMemo(() => {
    return allHeights.map((height) => ({
      height,
      meta: blockMeta.get(height),
    }));
  }, [allHeights, blockMeta]);

  // Check if more data available (filter mode only)
  const hasMore = useMemo(() => {
    if (!activeFilter) {
      // Normal mode: has more if we haven't reached latest block
      const lastHeight = anchorHeight + normalPageCount * GRID_SIZE;
      return lastHeight < latestBlock;
    }
    if (!data || data.length === 0) return true;
    const lastPage = data[data.length - 1];
    return lastPage.hasMore ?? lastPage.heights.length === GRID_SIZE;
  }, [activeFilter, anchorHeight, normalPageCount, latestBlock, data]);

  // Load meta for new blocks
  useEffect(() => {
    const heightsMissing = allHeights.filter((h) => !blockMeta.has(h));
    if (heightsMissing.length === 0) return;

    // Populate from module cache first
    const fromCache: { height: number; meta: BlockMeta }[] = [];
    const needsFetch: number[] = [];
    for (const h of heightsMissing) {
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

    async function loadMeta() {
      const results = await Promise.all(
        needsFetch.map(async (height) => {
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
    setNormalPageCount(1);
    setVisiblePageIndex(0);
  }, [activeFilter, anchorHeight]);

  // Reset loadingMore when new content arrives
  useEffect(() => {
    setLoadingMore(false);
  }, [allHeights.length]);

  const loadMore = useCallback(() => {
    if (isValidating || loadingMore) return;

    if (activeFilter) {
      // Filter mode: use SWR
      if (hasMore) setSize((s) => s + 1);
    } else {
      // Normal mode: just increase page count
      if (hasMore) {
        setLoadingMore(true);
        setNormalPageCount((p) => p + 1);
      }
    }
  }, [isValidating, loadingMore, activeFilter, hasMore, setSize]);

  const jumpTo = (target: number) => {
    setActiveFilter(null);
    setVisiblePageIndex(0);
    const newAnchor = Math.max(0, Math.min(target, latestBlock));
    setAnchorHeight(newAnchor);
    setNormalPageCount(1);
    setBlockMeta(new Map());
  };

  const toggleFilter = (id: string) => {
    if (activeFilter === id) {
      setActiveFilter(null);
    } else {
      setActiveFilter(id);
    }
    setBlockMeta(new Map());
    setNormalPageCount(1);
    setSize(0); // Reset SWR page count
    mutate(undefined, { revalidate: false });
  };

  const isLoading = activeFilter && !data && !error;
  const loadedCount = allHeights.length;
  const totalCount = data?.[0]?.total;
  const totalPages = totalCount ? Math.ceil(totalCount / GRID_SIZE) : 0;

  // Track visible page based on scroll position (for filter mode)
  const gridRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!activeFilter || !gridRef.current) return;

    const grid = gridRef.current;
    const cards = grid.querySelectorAll('[data-block-index]');
    if (cards.length === 0) return;

    // Only observe the first card of each page instead of every card
    const pageBoundaryCards: Element[] = [];
    cards.forEach((card) => {
      const index = parseInt(card.getAttribute('data-block-index') || '0', 10);
      if (index % GRID_SIZE === 0) pageBoundaryCards.push(card);
    });
    if (pageBoundaryCards.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-block-index') || '0', 10);
            const pageIndex = Math.floor(index / GRID_SIZE);
            setVisiblePageIndex((prev) => prev === pageIndex ? prev : pageIndex);
          }
        });
      },
      { rootMargin: '-40% 0px -40% 0px', threshold: 0 }
    );

    pageBoundaryCards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [activeFilter, allHeights.length]);

  // Prevent hydration mismatch by showing skeleton until mounted
  if (!mounted) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 md:gap-4 px-3 md:px-4 pb-12 pt-3 md:pt-4">
        <div className="br-card p-3 md:p-5">
          <div className="flex items-center gap-4">
            <div className="h-8 w-48 bg-primary/10 rounded animate-pulse" />
            <div className="ml-auto h-6 w-24 bg-primary/10 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {Array.from({ length: GRID_SIZE }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="aspect-square border border-[rgba(120,72,18,0.3)] bg-black/20 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

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

        </div>

        <CollectionFilterPanel
          collections={COLLECTION_FILTER_LAYOUT}
          activeFilter={activeFilter}
          onToggle={toggleFilter}
        />
      </div>

      {/* Sticky Navigation Bar */}
      <div className="sticky top-[var(--header-total)] z-30 -mx-3 md:-mx-4 px-3 md:px-4 py-2 bg-bg/95 backdrop-blur-sm border-y border-[rgba(255,255,255,0.06)]">
        <div className="text-center font-mono text-xs">
          {activeFilter ? (
            <span className="text-zinc-400">
              {/* Mobile: abbreviated counts */}
              <span className="md:hidden">
                <span className="text-primary font-bold">{abbreviateNumber(loadedCount)}</span>
                <span className="text-zinc-600 mx-1">/</span>
                <span className="text-zinc-500">{totalCount ? abbreviateNumber(totalCount) : '...'}</span>
              </span>
              {/* Desktop: full counts */}
              <span className="hidden md:inline">
                <span className="text-primary font-bold">{loadedCount.toLocaleString()}</span>
                <span className="text-zinc-600 mx-1.5">/</span>
                <span className="text-zinc-500">{totalCount?.toLocaleString() ?? '...'}</span>
              </span>
              {totalPages > 0 && (
                <span className="text-zinc-600 ml-2 md:ml-3">Pg {visiblePageIndex + 1}</span>
              )}
            </span>
          ) : (
            <span className="text-primary font-bold">
              {/* Mobile: abbreviated */}
              <span className="md:hidden">{abbreviateNumber(anchorHeight, "+")}</span>
              {/* Desktop: full number */}
              <span className="hidden md:inline">{anchorHeight.toLocaleString()}+</span>
            </span>
          )}
        </div>
      </div>

      {/* Grid */}
      <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {blocks.map((b, index) => (
          <BlockCard
            key={b.height}
            height={b.height}
            meta={b.meta}
            listingStatus={b.listingStatus}
            price={b.price}
            isometric={isometric}
            index={index}
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
        isLoading={isValidating || loadingMore}
      />

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
