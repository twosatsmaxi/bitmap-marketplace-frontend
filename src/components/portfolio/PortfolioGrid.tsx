"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import useSWRInfinite from "swr/infinite";
import { Box, Square } from "lucide-react";
import BlockCard from "@/components/explore/BlockCard";
import InfiniteScrollTrigger from "@/components/explore/InfiniteScrollTrigger";
import type { BlockMeta } from "@/components/explore/types";
import type { PortfolioResponse } from "@/lib/api";
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

export default function PortfolioGrid({ address, initialData }: PortfolioGridProps) {
  const [blockMeta, setBlockMeta] = useState<Map<number, BlockMeta>>(new Map());
  const [isometric, toggle3D] = use3DPreference();

  const getKey = useCallback(
    (pageIndex: number, previousPageData: PortfolioResponse | null): string | null => {
      if (previousPageData && !previousPageData.has_more) return null;
      return `/api/portfolio/${address}?page=${pageIndex}&limit=${PAGE_SIZE}`;
    },
    [address]
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
  }, [heights, blockMeta]);

  const loadMore = useCallback(() => {
    if (isValidating) return;
    if (hasMore) setSize((s) => s + 1);
  }, [isValidating, hasMore, setSize]);

  const isLoading = !data && !error;

  return (
    <>
      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
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
              className="aspect-square border border-[rgba(120,72,18,0.3)] bg-black/20 animate-pulse"
            />
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
