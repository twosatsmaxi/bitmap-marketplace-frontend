"use client";

import { useCallback, useEffect, useState } from "react";
import { Zap, ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import BlockCard from "./BlockCard";
import BlockSearch from "./BlockSearch";
import type { BlockMeta, BlockRendered, InterestingBlock, FilterCategory } from "./types";
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

const FILTER_CATEGORIES: FilterCategory[] = [
  { id: "punks", label: "Punks" },
  { id: "palindrome", label: "Palindrome" },
  { id: "repdigit", label: "Repdigit" },
  { id: "sub-100k", label: "Sub 100k" },
  { id: "patoshi", label: "Patoshi" },
  { id: "billionaire", label: "Billionaire" },
  { id: "nakamoto", label: "Nakamoto" },
  { id: "pizza", label: "Pizza Block" },
  { id: "pristine-punk", label: "Pristine Punk" },
  { id: "perfect-punk", label: "Perfect Punk" },
];

// Module-level meta cache to avoid refetching
const metaCache = new Map<number, BlockMeta>();

// Persist navigation state across remounts (e.g. back from detail page)
let savedAnchorHeight: number | null = null;
let savedActiveFilter: string | null = null;
let savedFilterPage = 0;

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
  const [activeFilter, setActiveFilter] = useState<string | null>(savedActiveFilter);
  const [filterPage, setFilterPage] = useState(savedFilterPage);
  const [hasMore, setHasMore] = useState(false);

  const [anchorHeight, setAnchorHeight] = useState(
    savedAnchorHeight ?? Math.max(latestBlock - (GRID_SIZE - 1), 0)
  );

  // Sync navigation state to module-level for persistence across remounts
  useEffect(() => { savedAnchorHeight = anchorHeight; }, [anchorHeight]);
  useEffect(() => { savedActiveFilter = activeFilter; }, [activeFilter]);
  useEffect(() => { savedFilterPage = filterPage; }, [filterPage]);

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
    setAnchorHeight(
      Math.max(
        Math.min(target - Math.floor(GRID_SIZE / 2), latestBlock - GRID_SIZE + 1),
        0
      )
    );
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
  const currentCategory = FILTER_CATEGORIES.find(c => c.id === activeFilter);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 pb-12 pt-4 md:px-6">

      {/* Header panel */}
      <div className="br-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-mono text-xl font-black uppercase tracking-[0.12em] text-primary md:text-2xl">
              Bitmap Explorer
            </h1>
            <p className="mt-1 font-mono text-xs text-zinc-500 tracking-wide">
              Every Bitcoin block is a bitmap. This is what they look like.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.035)] rounded px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
              Chain tip{" "}
              <span className="text-primary">#{latestBlock.toLocaleString()}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BlockSearch onSearch={jumpTo} />
        <div className="flex items-center gap-2">
          <button
            onClick={goPrev}
            disabled={activeFilter ? filterPage === 0 : anchorHeight === 0}
            className="br-btn flex items-center gap-1 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Prev
          </button>

          <div className="flex min-w-[120px] items-center justify-center gap-2 font-mono text-[10px] text-zinc-600">
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

      {/* Collections Row */}
      <div className="flex flex-col gap-3">
        {/* Notable blocks */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
          <div className="flex flex-shrink-0 items-center gap-1.5 text-zinc-600">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em]">
              Legendary
            </span>
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

        {/* Filter chips */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
          <div className="flex flex-shrink-0 items-center gap-1.5 text-zinc-600">
            <LayoutGrid className="h-3.5 w-3.5 text-zinc-500" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em]">
              Collections
            </span>
          </div>
          {FILTER_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => toggleFilter(cat.id)}
              className={cn(
                "flex-shrink-0 border rounded px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.16em] transition-all",
                activeFilter === cat.id
                  ? "bg-[rgba(247,162,59,0.18)] text-primary border-[rgba(247,162,59,0.45)] ring-1 ring-primary/20"
                  : "border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] text-zinc-500 hover:text-zinc-300 hover:border-[rgba(255,255,255,0.15)]"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3×3 grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
