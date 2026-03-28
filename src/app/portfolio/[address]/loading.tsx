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

      {/* Grid skeleton */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 md:gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
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
    </div>
  );
}
