import type { Metadata } from "next";
import { Suspense } from "react";
import ExploreClientInfinite from "@/components/explore/ExploreClientInfinite";
import { ExploreGridSkeleton } from "@/components/ui/ExploreGridSkeleton";

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

async function HomeContent() {
  const latestBlock = await getChainTip();
  return <ExploreClientInfinite latestBlock={latestBlock} />;
}

export default function HomePage() {
  return (
    <Suspense fallback={<ExploreGridSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}
