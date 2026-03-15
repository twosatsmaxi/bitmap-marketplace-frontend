import { notFound } from "next/navigation";
import { getBitmap, getBitmapPriceHistory, getRelatedBitmaps } from "@/lib/api";
import MetadataPanel from "@/components/detail/MetadataPanel";
import ActionPanel from "@/components/detail/ActionPanel";
import PriceHistoryChart from "@/components/detail/PriceHistoryChart";
import RelatedBitmaps from "@/components/detail/RelatedBitmaps";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import DetailCanvas from "@/components/detail/DetailCanvas";

export const revalidate = 60;

interface PageProps {
  params: { id: string };
}

export default async function BitmapDetailPage({ params }: PageProps) {
  const { id } = params;
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
    <div className="min-h-screen bg-bg">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="mb-6">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-zinc-500 transition-colors hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Explorer
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
          {/* Left Column: Canvas and Chart */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <DetailCanvas blockNumber={bitmap.blockNumber} />

            <div className="br-card px-5 py-5">
              <h2 className="mb-6 font-mono text-xl font-bold uppercase text-primary">Price History</h2>
              <PriceHistoryChart data={priceHistory} />
            </div>
          </div>

          {/* Right Column: Metadata and Actions */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <ActionPanel bitmap={bitmap} />
            <MetadataPanel bitmap={bitmap} />
          </div>
        </div>

        {/* Related Bitmaps Section */}
        {relatedBitmaps.length > 0 && (
          <div className="mt-16">
            <RelatedBitmaps bitmaps={relatedBitmaps.filter((b) => b.id !== bitmap.id)} />
          </div>
        )}
      </div>
    </div>
  );
}
