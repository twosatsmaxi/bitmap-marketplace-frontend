export default function PortfolioLoading() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 md:gap-4 px-3 md:px-4 pb-12 pt-3 md:pt-4">
      {/* Header skeleton */}
      <div className="br-card p-3 md:p-5">
        <div className="flex flex-col gap-1">
          <div className="h-6 w-48 rounded animate-shimmer" />
          <div className="h-4 w-32 rounded animate-shimmer mt-1" />
        </div>
      </div>

      {/* Grid skeleton with centered overlay */}
      <div className="relative">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="br-card flex flex-col overflow-hidden p-0">
              <div className="flex items-center px-2.5 py-1.5 md:px-3 md:py-2">
                <div className="h-3 w-24 rounded animate-shimmer" />
              </div>
              <div className="relative mx-2 aspect-square rounded-lg bg-[#090c11] overflow-hidden">
                <div className="absolute inset-0 animate-shimmer" />
              </div>
              <div className="flex flex-col gap-0.5 md:gap-1 px-2.5 py-2 md:px-3 md:py-3">
                <div className="h-2.5 w-16 rounded animate-shimmer" />
              </div>
            </div>
          ))}
        </div>
        {/* Centered overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-xs md:text-sm uppercase tracking-[0.2em] text-zinc-400 animate-pulse">
            Loading bitmaps
          </span>
          <span className="mt-1.5 flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1 w-1 rounded-full bg-primary"
                style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}
