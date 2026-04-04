export function ExploreGridSkeleton() {
  return (
    <div className="min-h-screen bg-bg p-4 md:p-6">
      <div className="mx-auto mb-6 h-10 max-w-xl animate-pulse rounded bg-zinc-800/60" />
      <div className="mx-auto mb-6 flex max-w-xl justify-center gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-20 animate-pulse rounded bg-zinc-800/60" />
        ))}
      </div>
      <div className="mx-auto grid max-w-[1600px] grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-square animate-pulse rounded bg-zinc-800/60" />
        ))}
      </div>
    </div>
  );
}
