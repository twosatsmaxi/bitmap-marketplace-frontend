import { notFound } from "next/navigation";
import { getBitmap, getBitmapPriceHistory, getBitmapDetails } from "@/lib/api";
import { MOCK_BITMAPS } from "@/lib/mock-data";
import type { Bitmap } from "@/lib/types";
import MetadataPanel from "@/components/detail/MetadataPanel";
import ActionPanel from "@/components/detail/ActionPanel";
import MobileActionBar from "@/components/detail/MobileActionBar";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import DetailCanvas from "@/components/detail/DetailCanvas";
import PriceHistoryChart from "@/components/detail/PriceHistoryChart";
import BitmapPreview from "@/components/detail/BitmapPreview";
import SwipeNavigator from "@/components/detail/SwipeNavigator";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Merge real bitmap details from backend with base bitmap data
 * Preserves backward compatibility with existing components
 */
function mergeBitmapData(
  baseBitmap: Bitmap,
  details: Awaited<ReturnType<typeof getBitmapDetails>>
): Bitmap {
  if (!details) return baseBitmap;

  return {
    ...baseBitmap,
    inscriptionId: details.inscription_id,
    inscriptionNumber: details.inscription_number,
    owner: details.owner,
    genesisHeight: details.genesis_height,
    traits: details.traits,
    childrenCount: details.children_count,
    children: details.children,
  };
}

export default async function BitmapDetailPage({ params }: PageProps) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  // Extract block number from ID (e.g., "840001.bitmap" -> 840001)
  const bitmapMatch = decodedId.match(/^(\d+)\.bitmap$/);
  const blockNum = bitmapMatch ? Number(bitmapMatch[1]) : NaN;

  const [baseBitmap, priceHistory, details] = await Promise.all([
    getBitmap(decodedId),
    getBitmapPriceHistory(decodedId),
    !isNaN(blockNum) ? getBitmapDetails(blockNum) : null,
  ]);

  if (!baseBitmap) {
    notFound();
  }

  // Merge real data from backend with base bitmap
  const bitmap = mergeBitmapData(baseBitmap, details);

  // Get 4 random listed bitmaps with price > 0.1 BTC (10M sats) for "More from this Pattern"
  const MIN_PRICE_SATS = 10_000_000; // 0.1 BTC
  const highValueListings = MOCK_BITMAPS.filter(
    (b) => b.listingStatus === "listed" && b.price && b.price >= MIN_PRICE_SATS && b.blockNumber !== bitmap.blockNumber
  );
  const relatedBitmaps = highValueListings
    .sort(() => Math.random() - 0.5)
    .slice(0, 4);

  return (
    <SwipeNavigator blockNumber={bitmap.blockNumber}>
    <div className="min-h-screen bg-bg pb-24 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8">
        {/* Header: Back Navigation + Title */}
        <div className="mb-4 md:mb-6">
          {/* Back Link - Icon only on mobile, with text on desktop */}
          <div className="mb-3 md:mb-4">
            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 md:gap-2 text-zinc-500 transition-colors hover:text-primary"
              aria-label="Back to Explorer"
            >
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden md:inline font-mono text-xs font-bold uppercase tracking-[0.14em]">
                Back to Explorer
              </span>
            </Link>
          </div>

          {/* Page Title */}
          <h1 className="font-mono text-2xl md:text-4xl font-black uppercase tracking-tight text-primary">
            {bitmap.blockNumber}.bitmap
          </h1>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 lg:gap-10">
          {/* Left Column: Canvas and Chart */}
          <div className="lg:col-span-7 flex flex-col gap-4 md:gap-6">
            <DetailCanvas blockNumber={bitmap.blockNumber} />

            <div className="br-card px-4 py-4 md:px-5 md:py-5">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="font-mono text-lg md:text-xl font-bold uppercase text-primary">
                  Price History
                </h2>
                <span className="px-2 py-1 pixel-cut-sm text-[10px] uppercase font-mono tracking-[0.15em] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30">
                  Soon
                </span>
              </div>
              <div className="h-[250px] md:h-[300px] opacity-50 pointer-events-none">
                <PriceHistoryChart data={priceHistory} />
              </div>
            </div>
          </div>

          {/* Right Column: Metadata and Actions */}
          <div className="lg:col-span-5 flex flex-col gap-4 md:gap-6">
            {/* Desktop Action Panel */}
            <div className="hidden md:block">
              <ActionPanel bitmap={bitmap} />
            </div>
            <MetadataPanel bitmap={bitmap} />
          </div>
        </div>
      </div>

      {/* More from this Pattern */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 mt-8 md:mt-16">
        <h2 className="font-mono text-lg md:text-xl font-bold uppercase text-primary mb-4 md:mb-6">
          More from this Pattern
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {relatedBitmaps.map((related) => (
            <Link
              key={related.blockNumber}
              href={`/bitmap/${related.blockNumber}.bitmap`}
              className="br-card group flex flex-col overflow-hidden p-0 transition-all hover:border-[rgba(255,255,255,0.15)]"
            >
              <div className="flex items-center justify-between px-2.5 py-1.5 md:px-3 md:py-2">
                <span className="font-mono text-[10px] md:text-xs font-bold text-[#f7a23b]">
                  {related.blockNumber}.bitmap
                </span>
                {related.price && (
                  <span className="font-mono text-[9px] text-zinc-400">
                    {(related.price / 100_000_000).toFixed(2)} BTC
                  </span>
                )}
              </div>
              <div className="relative mx-2 aspect-square rounded-lg bg-[#090c11] overflow-hidden">
                <BitmapPreview height={related.blockNumber} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile Action Bar */}
      <MobileActionBar bitmap={bitmap} />
    </div>
    </SwipeNavigator>
  );
}
