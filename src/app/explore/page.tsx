import type { Metadata } from "next";
import { Suspense } from "react";
import ExploreClientInfinite from "@/components/explore/ExploreClientInfinite";

export const metadata: Metadata = {
  title: "Bitmap Explorer — Bitmap Marketplace",
  description:
    "Every Bitcoin block has a bitmap. Browse them all — from genesis to now.",
};

// Hardcoded fallback - avoids mempool.space connection timeouts
const FALLBACK_CHAIN_TIP = 893_000;

export default async function ExplorePage() {
  return (
    <Suspense fallback={null}>
      <ExploreClientInfinite latestBlock={FALLBACK_CHAIN_TIP} />
    </Suspense>
  );
}
