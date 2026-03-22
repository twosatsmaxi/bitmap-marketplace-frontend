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

export default async function ExplorePage() {
  const latestBlock = await getChainTipServer();

  return (
    <Suspense fallback={null}>
      <ExploreClientInfinite latestBlock={latestBlock} />
    </Suspense>
  );
}
