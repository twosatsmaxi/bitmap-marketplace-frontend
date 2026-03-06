import { notFound } from "next/navigation";
import { getBitmap, getBitmapPriceHistory, getRelatedBitmaps } from "@/lib/api";
import BitmapCanvas from "@/components/bitmap-art/BitmapCanvas";
import MetadataPanel from "@/components/detail/MetadataPanel";
import ActionPanel from "@/components/detail/ActionPanel";
import PriceHistoryChart from "@/components/detail/PriceHistoryChart";
import RelatedBitmaps from "@/components/detail/RelatedBitmaps";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
            href="/"
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors font-mono uppercase tracking-wide"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Browse
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
          {/* Left Column: Canvas and Chart */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="panel-frame pixel-cut bg-bg w-full aspect-square relative flex items-center justify-center p-4">
              <BitmapCanvas
                blockNumber={bitmap.blockNumber}
                bitmapType={bitmap.bitmapType}
                className="w-full h-full object-contain max-h-[600px]"
                width={800}
                height={800}
              />
            </div>
            
            <div className="panel-frame pixel-cut p-5">
              <h2 className="font-heading font-bold text-xl mb-6">Price History</h2>
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
