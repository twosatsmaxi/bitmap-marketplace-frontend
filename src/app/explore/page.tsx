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

export default async function ExplorePage() {
  const latestBlock = await getChainTip();

  return (
    <Suspense fallback={null}>
      <ExploreClientInfinite latestBlock={latestBlock} />
    </Suspense>
  );
}
