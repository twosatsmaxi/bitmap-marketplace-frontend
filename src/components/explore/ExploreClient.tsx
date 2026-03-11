"use client";

import { useCallback, useEffect, useState } from "react";
import { Zap, ChevronLeft, ChevronRight } from "lucide-react";
import BlockCard from "./BlockCard";
import BlockSearch from "./BlockSearch";
import type { BlockMeta, BlockRendered, InterestingBlock } from "./types";

const RENDER_API = process.env.NEXT_PUBLIC_RENDER_API_BASE ?? "http://localhost:3000";
const GRID_SIZE = 9;

const INTERESTING_BLOCKS: InterestingBlock[] = [
  { label: "Genesis", height: 0 },
  { label: "Halving I", height: 210_000 },
  { label: "Halving II", height: 420_000 },
  { label: "Halving III", height: 630_000 },
  { label: "Halving IV", height: 840_000 },
  { label: "777777", height: 777_777 },
  { label: "800800", height: 800_800 },
];

// Module-level meta cache to avoid refetching
const metaCache = new Map<number, BlockMeta>();

async function fetchMeta(height: number): Promise<BlockMeta | undefined> {
  if (metaCache.has(height)) return metaCache.get(height);
  try {
    const res = await fetch(`${RENDER_API}/api/block/${height}/meta`);
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
  const [anchorHeight, setAnchorHeight] = useState(
    Math.max(latestBlock - (GRID_SIZE - 1), 0)
  );
  const [blocks, setBlocks] = useState<BlockRendered[]>(() =>
    buildHeights(Math.max(latestBlock - (GRID_SIZE - 1), 0), latestBlock).map((h) => ({
      height: h,
      status: "idle",
    }))
  );

  // Fetch meta for visible blocks
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

  // Rebuild block list when anchor changes
  useEffect(() => {
    const heights = buildHeights(anchorHeight, latestBlock);
    setBlocks(heights.map((h) => ({ height: h, status: "idle" })));
    loadMeta(heights);
  }, [anchorHeight, latestBlock, loadMeta]);

  const goPrev = () =>
    setAnchorHeight((a) => Math.max(a - GRID_SIZE, 0));
  const goNext = () =>
    setAnchorHeight((a) => Math.min(a + GRID_SIZE, latestBlock));
  const jumpTo = (target: number) =>
    setAnchorHeight(
      Math.max(
        Math.min(target - Math.floor(GRID_SIZE / 2), latestBlock - GRID_SIZE + 1),
        0
      )
    );

  const rangeEnd = Math.min(anchorHeight + GRID_SIZE - 1, latestBlock);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 pb-12 pt-4 md:px-6">

      {/* Header panel */}
      <div className="home-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-mono text-xl font-black uppercase tracking-[0.12em] text-primary md:text-2xl">
              Block Explorer
            </h1>
            <p className="mt-1 font-mono text-xs text-zinc-500 tracking-wide">
              Bitcoin blocks visualised as WASM-rendered bitmaps
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="border border-[rgba(120,72,18,0.55)] bg-[rgba(247,147,26,0.06)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
              Chain tip{" "}
              <span className="text-primary">#{latestBlock.toLocaleString()}</span>
            </span>
            <span className="border border-[rgba(120,72,18,0.55)] bg-[rgba(247,147,26,0.06)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
              Viewing{" "}
              <span className="text-primary">
                {anchorHeight.toLocaleString()}–{rangeEnd.toLocaleString()}
              </span>
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
            disabled={anchorHeight === 0}
            className="flex items-center gap-1 border border-[rgba(120,72,18,0.55)] bg-[rgba(247,147,26,0.04)] px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-zinc-400 transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Prev
          </button>
          <span className="min-w-[120px] text-center font-mono text-[10px] text-zinc-600">
            {anchorHeight.toLocaleString()} – {rangeEnd.toLocaleString()}
          </span>
          <button
            onClick={goNext}
            disabled={anchorHeight + GRID_SIZE > latestBlock}
            className="flex items-center gap-1 border border-[rgba(120,72,18,0.55)] bg-[rgba(247,147,26,0.04)] px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-zinc-400 transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Notable blocks */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        <div className="flex flex-shrink-0 items-center gap-1.5 text-zinc-600">
          <Zap className="h-3.5 w-3.5 text-primary" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em]">
            Notable
          </span>
        </div>
        {INTERESTING_BLOCKS.map((b) => (
          <button
            key={b.height}
            onClick={() => jumpTo(b.height)}
            className="home-chip flex-shrink-0"
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* 3×3 grid */}
      <div className="grid grid-cols-3 gap-4">
        {blocks.map((b) => (
          <BlockCard
            key={b.height}
            height={b.height}
            meta={b.meta}
            listingStatus={b.listingStatus}
            price={b.price}
          />
        ))}
      </div>

      {/* Bottom navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={goPrev}
          disabled={anchorHeight === 0}
          className="font-mono text-xs text-zinc-500 transition-colors hover:text-primary disabled:opacity-40"
        >
          ← Earlier blocks
        </button>
        <button
          onClick={goNext}
          disabled={anchorHeight + GRID_SIZE > latestBlock}
          className="font-mono text-xs text-zinc-500 transition-colors hover:text-primary disabled:opacity-40"
        >
          Later blocks →
        </button>
      </div>
    </div>
  );
}
