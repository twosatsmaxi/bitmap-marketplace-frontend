"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Zap, ChevronLeft, ChevronRight } from "lucide-react";
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

const RENDER_API = "";
const GRID_SIZE = 9;

const INTERESTING_BLOCKS: InterestingBlock[] = [
  { label: "Genesis", height: 0 },
  { label: "Halving I", height: 210_000 },
  { label: "Halving II", height: 420_000 },
  { label: "Halving III", height: 630_000 },
  { label: "Halving IV", height: 840_000 },
];

const COLLECTION_FILTER_LAYOUT: CollectionFilterMeta[] = [
  { id: "pizza", label: "Pizza Block", priority: 1, highlight: "The 10,000 BTC Pizza Transaction" },
  { id: "repdigit", label: "Same Digits", priority: 2, highlight: "Block Height with Identical Digits" },
  { id: "nakamoto", label: "Nakamoto", priority: 3, highlight: "Blocks Mined by Satoshi Nakamoto" },
  { id: "billionaire", label: "Billionaire", priority: 4, highlight: "Blocks with Massive BTC Activity" },
  { id: "patoshi", label: "Patoshi", priority: 5, highlight: "Early Patoshi Pattern Miner Blocks" },
  { id: "punks", label: "Punks", priority: 6, highlight: "Blocks Rendered as Pixel Avatars" },
  { id: "perfect-punk", label: "Perfect Punk", priority: 7, highlight: "Flawlessly Formed Avatar Patterns" },
  { id: "pristine-punk", label: "Pristine Punk", priority: 8, highlight: "Highest Fidelity Avatar Rendering" },
  { id: "palindrome", label: "Palindrome", priority: 9, highlight: "Block Height Reads Same Backwards" },
  { id: "sub-100k", label: "Sub 100k", priority: 10, highlight: "First 100,000 Historic Blocks" },
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
          const heights: number[] = data.heights;
          setHasMore(data.hasMore);

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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 pb-12 pt-4 md:px-6">

      {/* Header panel */}
      <div className="br-card p-5">
        <div className="flex flex-col gap-3">
          {/* Top row: Title + search + tip */}
          <div className="flex items-center gap-4">
            <h1 className="font-mono text-xl font-black uppercase tracking-[0.12em] text-primary md:text-2xl">
              Bitmap Explorer
            </h1>
            <BlockSearch onSearch={jumpTo} latestBlock={latestBlock} />
            <span className="ml-auto border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.035)] rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
              Tip <span className="text-primary">#{latestBlock.toLocaleString()}</span>
            </span>
          </div>
          
          {/* Subtitle below */}
          <p className="font-mono text-xs text-zinc-500 tracking-wide">
            Every Bitcoin block is a bitmap. be the bitmap 🟧
          </p>
        </div>
      </div>

      {/* Collections filter and legendary links */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          {/* Left: Legendary scrollable section */}
          <div className="flex flex-1 items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
            <div className="flex flex-shrink-0 items-center gap-1.5 text-zinc-600">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Legendary</span>
            </div>
          {INTERESTING_BLOCKS.map((b) => (
            <button
              key={b.height}
              onClick={() => jumpTo(b.height)}
              className="flex-shrink-0 border border-[rgba(255,255,255,0.1)] rounded bg-[rgba(255,255,255,0.04)] px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-400 transition-colors hover:border-[rgba(247,162,59,0.45)] hover:text-primary"
            >
              {b.label}
            </button>
          ))}
          </div>
          
          {/* Right: PREV/NEXT navigation */}
          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              onClick={goPrev}
              disabled={activeFilter ? filterPage === 0 : anchorHeight === 0}
              className="br-btn flex items-center gap-1 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </button>

            <div className="flex min-w-[100px] items-center justify-center gap-2 font-mono text-[10px] text-zinc-600">
              {activeFilter ? (
                <span>PAGE {filterPage + 1}</span>
              ) : (
                <span>{anchorHeight.toLocaleString()} – {rangeEnd.toLocaleString()}</span>
              )}
            </div>

            <button
              onClick={goNext}
              disabled={activeFilter ? !hasMore : anchorHeight + GRID_SIZE > latestBlock}
              className="br-btn flex items-center gap-1 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <CollectionFilterPanel
          collections={COLLECTION_FILTER_LAYOUT}
          activeFilter={activeFilter}
          onToggle={toggleFilter}
        />
      </div>

      {/* 4×4 grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {blocks.map((b) => (
          <BlockCard
            key={b.height}
            height={b.height}
            meta={b.meta}
            listingStatus={b.listingStatus}
            price={b.price}
          />
        ))}
        {blocks.length === 0 && (
          <div className="col-span-full py-20 text-center border border-dashed border-[rgba(255,255,255,0.08)] bg-black/20 rounded-lg">
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
          ← Older bitmaps
        </button>
        <button
          onClick={goNext}
          disabled={activeFilter ? !hasMore : anchorHeight + GRID_SIZE > latestBlock}
          className="font-mono text-xs text-zinc-500 transition-colors hover:text-primary disabled:opacity-40"
        >
          Newer bitmaps →
        </button>
      </div>
    </div>
  );
}
