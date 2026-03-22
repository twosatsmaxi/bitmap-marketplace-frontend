"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Zap, ChevronLeft, ChevronRight, Box } from "lucide-react";
import BlockCard from "./BlockCard";
import BlockSearch from "./BlockSearch";
import CollectionFilterPanel from "./CollectionFilterPanel";
import type {
  BlockMeta,
  BlockRendered,
  CollectionFilterMeta,
  InterestingBlock,
} from "./types";
import { cn } from "@/lib/utils";
import { use3DPreference } from "@/hooks/use3DPreference";

const RENDER_API = "";
const GRID_SIZE = 12;  // Divisible by 2, 3, and 4 for clean grid rows

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
  // Row 1: Historical/Early Bitcoin
  { id: "pizza", label: "Pizza Block", priority: 1, highlight: "The 10,000 BTC Pizza Transaction", category: "historical" },
  { id: "patoshi", label: "Patoshi", priority: 2, highlight: "Early Patoshi Pattern Miner Blocks", category: "historical" },
  { id: "nakamoto", label: "Nakamoto", priority: 3, highlight: "Blocks Mined by Satoshi Nakamoto", category: "historical" },
  // Row 2: Punk variants
  { id: "punks", label: "Punks", priority: 4, highlight: "Blocks Rendered as Pixel Avatars", category: "punk" },
  { id: "perfect-punk", label: "Perfect Punk", priority: 5, highlight: "Flawlessly Formed Avatar Patterns", category: "punk" },
  { id: "pristine-punk", label: "Pristine Punk", priority: 6, highlight: "Highest Fidelity Avatar Rendering", category: "punk" },
  // Row 3: Numeric patterns
  { id: "same-digits", label: "Same Digits", priority: 7, highlight: "Block Height with Identical Digits", category: "numeric" },
  { id: "palindrome", label: "Palindrome", priority: 8, highlight: "Block Height Reads Same Backwards", category: "numeric" },
  { id: "sub-100k", label: "Sub 100k", priority: 9, highlight: "First 100,000 Historic Blocks", category: "numeric" },
  { id: "billionaire", label: "Billionaire", priority: 10, highlight: "Blocks with Massive BTC Activity", category: "numeric" },
];


// Module-level meta cache to avoid refetching
const metaCache = new Map<number, BlockMeta>();

// Persist navigation state across remounts (e.g. back from detail page)
let savedAnchorHeight: number | null = null;

// Sanitize saved value to ensure it's never negative
if (savedAnchorHeight !== null && savedAnchorHeight < 0) {
  savedAnchorHeight = null;
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

function buildHeights(anchor: number, latest: number): number[] {
  return Array.from({ length: GRID_SIZE }, (_, i) =>
    Math.min(Math.max(anchor + i, 0), latest)
  );
}

export default function ExploreClient({ latestBlock }: { latestBlock: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize from URL or default
  const urlFilter = searchParams.get("filter");
  const urlFilterPage = parseInt(searchParams.get("page") || "0", 10);

  const [activeFilter, setActiveFilter] = useState<string | null>(urlFilter);
  const [filterPage, setFilterPage] = useState(urlFilterPage);
  const [hasMore, setHasMore] = useState(false);
  const [totalPages, setTotalPages] = useState(0);

  const [anchorHeight, setAnchorHeight] = useState(() => {
    // Default to Halving IV (840,000) on first load, fallback to latest blocks if saved
    const halvingIV = 840_000;
    const saved = savedAnchorHeight ?? halvingIV;
    // Clamp saved value to valid range
    return Math.max(0, Math.min(saved, latestBlock));
  });

  // Sync navigation state to module-level for persistence across remounts
  useEffect(() => { savedAnchorHeight = anchorHeight; }, [anchorHeight]);

  // Sync filter to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (activeFilter) {
      params.set("filter", activeFilter);
    } else {
      params.delete("filter");
    }
    if (filterPage > 0) {
      params.set("page", filterPage.toString());
    } else {
      params.delete("page");
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [activeFilter, filterPage, pathname, router, searchParams]);

  const [isometric, toggle3D] = use3DPreference();
  const [blocks, setBlocks] = useState<BlockRendered[]>([]);

  // Fetch meta for blocks
  const loadMeta = useCallback(
    async (heights: number[]) => {
      const results = await Promise.all(heights.map(fetchMeta));
      setBlocks((prev) =>
        prev.map((b, i) => ({
          ...b,
          meta: results[i] ?? b.meta,
        }))
      );
    },
    []
  );

  // Rebuild block list when anchor or filter changes
  useEffect(() => {
    async function updateBlocks() {
      if (activeFilter) {
        try {
          const res = await fetch(`/api/explore/blocks?filter=${activeFilter}&page=${filterPage}&limit=${GRID_SIZE}`);
          const data = await res.json();
          const heights: number[] = data.heights ?? [];
          const total = data.total ?? 0;
          const calculatedHasMore = filterPage * GRID_SIZE + heights.length < total;
          setHasMore(data.hasMore ?? calculatedHasMore);
          setTotalPages(Math.ceil(total / GRID_SIZE));

          const newBlocks = heights.map(h => ({ height: h, status: "idle" as const }));
          setBlocks(newBlocks);
          loadMeta(heights);
        } catch (err) {
          console.error("Filter fetch failed", err);
        }
      } else {
        const heights = buildHeights(anchorHeight, latestBlock);
        setBlocks(heights.map((h) => ({ height: h, status: "idle" })));
        loadMeta(heights);
        setHasMore(anchorHeight + GRID_SIZE <= latestBlock);
      }
    }

    updateBlocks();
  }, [anchorHeight, latestBlock, loadMeta, activeFilter, filterPage]);

  const goPrev = () => {
    if (activeFilter) {
      setFilterPage(p => Math.max(p - 1, 0));
    } else {
      setAnchorHeight((a) => Math.max(a - GRID_SIZE, 0));
    }
  };

  const goNext = () => {
    if (activeFilter) {
      if (hasMore) setFilterPage(p => p + 1);
    } else {
      setAnchorHeight((a) => Math.min(a + GRID_SIZE, latestBlock));
    }
  };

  const jumpTo = (target: number) => {
    setActiveFilter(null);
    setFilterPage(0);
    // Show entered block first (no centering), clamped to valid range
    setAnchorHeight(Math.max(0, Math.min(target, latestBlock)));
  };

  const toggleFilter = (id: string) => {
    if (activeFilter === id) {
      setActiveFilter(null);
      setFilterPage(0);
    } else {
      setActiveFilter(id);
      setFilterPage(0);
    }
  };

  const rangeEnd = Math.min(anchorHeight + GRID_SIZE - 1, latestBlock);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 md:gap-4 px-3 md:px-4 pb-12 pt-3 md:pt-4">

      {/* Header panel */}
      <div className="br-card p-3 md:p-5">
        <div className="flex flex-col gap-2 md:gap-3">
          {/* Top row: Title + search + tip */}
          <div className="flex flex-wrap items-center gap-2 md:gap-4">
            <h1 className="font-mono text-lg font-black uppercase tracking-[0.1em] text-primary md:text-2xl">
              Bitmap Explorer
            </h1>
            <BlockSearch onSearch={jumpTo} latestBlock={latestBlock} currentHeight={anchorHeight} />
            <span className="ml-auto border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.035)] rounded px-2 py-0.5 font-mono text-[9px] md:text-[10px] uppercase tracking-[0.16em] md:tracking-[0.2em] text-zinc-400">
              Tip <span className="text-primary">#{latestBlock.toLocaleString()}</span>
            </span>
          </div>

          {/* Subtitle below */}
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
            {/* Legendary Icon - Only show icon on mobile */}
            <div className="flex flex-shrink-0 items-center justify-center w-9 h-9 md:w-auto md:h-auto rounded-md border border-[rgba(247,147,26,0.3)] bg-[rgba(247,147,26,0.1)] md:px-3 md:py-2">
              <Zap className="h-4 w-4 text-primary" fill="currentColor" />
              <span className="hidden md:inline font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary ml-2">
                Legendary
              </span>
            </div>

            {/* Scrollable Buttons */}
            <div className="relative flex-1 overflow-hidden">
              {/* Right Fade Gradient */}
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

          {/* Right: 3D toggle + PREV/NEXT navigation */}
          <div className="flex flex-shrink-0 items-center gap-1.5 md:gap-2">
            {/* 3D isometric toggle */}
            <button
              onClick={toggle3D}
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
          <div className="flex flex-shrink-0 items-center gap-1.5 md:gap-2">
            {/* Mobile: Icon only buttons */}
            <button
              onClick={goPrev}
              disabled={activeFilter ? filterPage === 0 : anchorHeight === 0}
              className="br-btn flex md:hidden items-center justify-center w-9 h-9 p-0 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Desktop: Text + Icon buttons */}
            <button
              onClick={goPrev}
              disabled={activeFilter ? filterPage === 0 : anchorHeight === 0}
              className="br-btn hidden md:flex items-center gap-1.5 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40 text-xs"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </button>

            {/* Page indicator */}
            <div className="flex min-w-[60px] md:min-w-[120px] items-center justify-center gap-2 font-mono text-[10px] md:text-[11px] text-zinc-500">
              {activeFilter ? (
                <span>Page {filterPage + 1}{totalPages > 0 && ` / ${totalPages}`}</span>
              ) : (
                <>
                  <span className="md:hidden">{anchorHeight.toLocaleString()}</span>
                  <span className="hidden md:inline">{anchorHeight.toLocaleString()} – {rangeEnd.toLocaleString()}</span>
                </>
              )}
            </div>

            {/* Mobile: Icon only button */}
            <button
              onClick={goNext}
              disabled={activeFilter ? !hasMore : anchorHeight + GRID_SIZE > latestBlock}
              className="br-btn flex md:hidden items-center justify-center w-9 h-9 p-0 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Desktop: Text + Icon button */}
            <button
              onClick={goNext}
              disabled={activeFilter ? !hasMore : anchorHeight + GRID_SIZE > latestBlock}
              className="br-btn hidden md:flex items-center gap-1.5 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40 text-xs"
            >
              Next
              <ChevronRight className="h-4 w-4" />
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
        {blocks.length === 0 && (
          <div className="col-span-full py-16 md:py-20 text-center border border-dashed border-[rgba(255,255,255,0.08)] bg-black/20 rounded-lg">
            <p className="font-mono text-sm text-zinc-500 uppercase tracking-widest">
              No matching bitmaps found for this page
            </p>
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={goPrev}
          disabled={activeFilter ? filterPage === 0 : anchorHeight === 0}
          className="font-mono text-xs text-zinc-500 transition-colors hover:text-primary disabled:opacity-40"
        >
          ← Older
        </button>
        <button
          onClick={goNext}
          disabled={activeFilter ? !hasMore : anchorHeight + GRID_SIZE > latestBlock}
          className="font-mono text-xs text-zinc-500 transition-colors hover:text-primary disabled:opacity-40"
        >
          Newer →
        </button>
      </div>
    </div>
  );
}
