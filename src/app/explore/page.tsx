import type { Metadata } from "next";
import { Suspense } from "react";
import ExploreClientInfinite from "@/components/explore/ExploreClientInfinite";
import { getChainTipServer } from "@/lib/chainTip";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Bitmap Explorer — Bitmap Marketplace",
  description:
    "Every Bitcoin block has a bitmap. Browse them all — from genesis to now.",
};

function ExploreSkeleton() {
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

async function ExploreContent() {
  const latestBlock = await getChainTipServer();
  return <ExploreClientInfinite latestBlock={latestBlock} />;
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<ExploreSkeleton />}>
      <ExploreContent />
    </Suspense>
  );
}
