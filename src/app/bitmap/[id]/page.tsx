import { notFound } from "next/navigation";
import { getBitmap, getBitmapPriceHistory, getRelatedBitmaps } from "@/lib/api";
import MetadataPanel from "@/components/detail/MetadataPanel";
import ActionPanel from "@/components/detail/ActionPanel";
import PriceHistoryChart from "@/components/detail/PriceHistoryChart";
import RelatedBitmaps from "@/components/detail/RelatedBitmaps";
import MobileActionBar from "@/components/detail/MobileActionBar";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import DetailCanvas from "@/components/detail/DetailCanvas";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BitmapDetailPage({ params }: PageProps) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  const [bitmap, priceHistory] = await Promise.all([
    getBitmap(decodedId),
    getBitmapPriceHistory(decodedId),
  ]);

  if (!bitmap) {
    notFound();
  }

  const relatedBitmaps = await getRelatedBitmaps(bitmap.bitmapType);

  return (
    <div className="min-h-screen bg-bg pb-24 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8">
        {/* Back Link */}
        <div className="mb-4 md:mb-6">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-zinc-500 transition-colors hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Explorer
          </Link>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 lg:gap-10">
          {/* Left Column: Canvas and Chart */}
          <div className="lg:col-span-7 flex flex-col gap-4 md:gap-6">
            <DetailCanvas blockNumber={bitmap.blockNumber} />

            <div className="br-card px-4 py-4 md:px-5 md:py-5">
              <h2 className="mb-4 md:mb-6 font-mono text-lg md:text-xl font-bold uppercase text-primary">
                Price History
              </h2>
              <div className="h-[250px] md:h-[300px]">
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

        {/* Related Bitmaps Section */}
        {relatedBitmaps.length > 0 && (
          <div className="mt-8 md:mt-16">
            <RelatedBitmaps bitmaps={relatedBitmaps.filter((b) => b.id !== bitmap.id)} />
          </div>
        )}
      </div>

      {/* Mobile Action Bar */}
      <MobileActionBar bitmap={bitmap} />
    </div>
  );
}
