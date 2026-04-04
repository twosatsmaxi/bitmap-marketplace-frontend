import type { Metadata } from "next";
import { Suspense } from "react";
import ExploreClientInfinite from "@/components/explore/ExploreClientInfinite";
import { getChainTipServer } from "@/lib/chainTip";
import { ExploreGridSkeleton } from "@/components/ui/ExploreGridSkeleton";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Bitmap Explorer — Bitmap Marketplace",
  description:
    "Every Bitcoin block has a bitmap. Browse them all — from genesis to now.",
};

async function ExploreContent() {
  const latestBlock = await getChainTipServer();
  return <ExploreClientInfinite latestBlock={latestBlock} />;
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<ExploreGridSkeleton />}>
      <ExploreContent />
    </Suspense>
  );
}
