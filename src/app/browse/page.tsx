import { Suspense } from "react";
import BrowseClient from "@/components/browse/BrowseClient";
import { getBitmaps } from "@/lib/api";

export const revalidate = 60;

function BrowseSkeleton() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto flex max-w-[1600px] flex-col md:flex-row">
        {/* Sidebar skeleton */}
        <div className="hidden md:block w-[280px] shrink-0 border-r border-[rgba(120,72,18,0.25)] p-6">
          <div className="mb-6 h-5 w-24 animate-pulse bg-zinc-800/60" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="mb-4 h-4 w-full animate-pulse bg-zinc-800/60" />
          ))}
        </div>
        {/* Main content skeleton */}
        <div className="flex-1 p-4 md:p-6">
          {/* Header skeleton */}
          <div className="mb-6 border border-[rgba(120,72,18,0.25)] p-4 md:p-6">
            <div className="mb-2 h-3 w-20 animate-pulse bg-zinc-800/60" />
            <div className="mb-3 h-8 w-40 animate-pulse bg-zinc-800/60" />
            <div className="flex gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 w-24 animate-pulse border border-[rgba(120,72,18,0.25)] bg-zinc-800/60" />
              ))}
            </div>
          </div>
          {/* Controls skeleton */}
          <div className="mb-4 flex items-center justify-between border-b border-[rgba(120,72,18,0.25)] pb-4">
            <div className="h-4 w-32 animate-pulse bg-zinc-800/60" />
            <div className="h-10 w-44 animate-pulse bg-zinc-800/60" />
          </div>
          {/* Grid skeleton */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex flex-col border border-[rgba(120,72,18,0.25)]">
                <div className="aspect-square animate-pulse bg-zinc-800/60" />
                <div className="p-3">
                  <div className="mb-2 h-4 w-24 animate-pulse bg-zinc-800/60" />
                  <div className="h-3 w-16 animate-pulse bg-zinc-800/60" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

async function BrowseContent() {
  const { bitmaps, total } = await getBitmaps();
  return <BrowseClient initialBitmaps={bitmaps} total={total} />;
}

export default function BrowsePage() {
  return (
    <div className="min-h-screen bg-bg">
      <Suspense fallback={<BrowseSkeleton />}>
        <BrowseContent />
      </Suspense>
    </div>
  );
}
