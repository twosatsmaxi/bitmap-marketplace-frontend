import type { Metadata } from "next";
import { Suspense } from "react";
import ExploreClientInfinite from "@/components/explore/ExploreClientInfinite";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Bitmap Explorer — Bitmap Marketplace",
  description:
    "Every Bitcoin block has a bitmap. Browse them all — from genesis to now.",
};

async function getChainTip(): Promise<number> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch("https://mempool.space/api/blocks/tip/height", {
      next: { revalidate: 60 },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) throw new Error("non-ok");
    const text = await res.text();
    const n = parseInt(text.trim(), 10);
    return isNaN(n) ? 893_000 : n;
  } catch {
    return 893_000;
  }
}

function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-bg p-4 md:p-6">
      {/* Search bar skeleton */}
      <div className="mx-auto mb-6 h-10 max-w-xl animate-pulse rounded bg-zinc-800/60" />
      {/* Filter chips skeleton */}
      <div className="mx-auto mb-6 flex max-w-xl justify-center gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-20 animate-pulse rounded bg-zinc-800/60" />
        ))}
      </div>
      {/* Grid skeleton */}
      <div className="mx-auto grid max-w-[1600px] grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-square animate-pulse rounded bg-zinc-800/60" />
        ))}
      </div>
    </div>
  );
}

async function HomeContent() {
  const latestBlock = await getChainTip();
  return <ExploreClientInfinite latestBlock={latestBlock} />;
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}
