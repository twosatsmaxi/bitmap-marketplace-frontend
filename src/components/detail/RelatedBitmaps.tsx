import type { Bitmap } from "@/lib/types";
import BitmapCard from "@/components/browse/BitmapCard";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface RelatedBitmapsProps {
  bitmaps: Bitmap[];
  patternType: string;
}

export default function RelatedBitmaps({ bitmaps, patternType }: RelatedBitmapsProps) {
  if (!bitmaps || bitmaps.length === 0) return null;

  return (
    <section>
      <div className="mb-6 flex items-center justify-between border-b border-[rgba(120,72,18,0.55)] pb-2">
        <h2 className="font-mono text-xl font-bold uppercase text-primary">More from this Pattern</h2>
        <Link
          href={`/browse?type=${patternType}`}
          className="group flex items-center gap-1 font-mono text-xs uppercase tracking-[0.14em] text-zinc-500 transition-colors hover:text-primary"
        >
          View All
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {bitmaps.map((bitmap) => (
          <BitmapCard key={bitmap.id} bitmap={bitmap} />
        ))}
      </div>
    </section>
  );
}
