import type { Bitmap } from "@/lib/types";
import BitmapCard from "@/components/browse/BitmapCard";

export default function RelatedBitmaps({ bitmaps }: { bitmaps: Bitmap[] }) {
  if (!bitmaps || bitmaps.length === 0) return null;

  return (
    <section>
      <div className="mb-6 flex items-center justify-between border-b border-[rgba(120,72,18,0.55)] pb-2">
        <h2 className="font-mono text-xl font-bold uppercase text-primary">More from this Pattern</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {bitmaps.map((bitmap) => (
          <BitmapCard key={bitmap.id} bitmap={bitmap} />
        ))}
      </div>
    </section>
  );
}
