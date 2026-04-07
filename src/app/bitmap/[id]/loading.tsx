export default function BitmapDetailLoading() {
  return (
    <div className="min-h-screen bg-bg pb-24 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8">
        {/* Header: Back Navigation + Title */}
        <div className="mb-4 md:mb-6">
          <div className="mb-3 md:mb-4">
            <div className="h-4 w-4 rounded animate-shimmer md:h-5 md:w-32" />
          </div>
          <div className="h-8 w-48 rounded animate-shimmer md:h-10 md:w-64" />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 lg:gap-10">
          {/* Left Column: Canvas and Chart */}
          <div className="lg:col-span-7 flex flex-col gap-4 md:gap-6">
            {/* Canvas */}
            <div className="br-card overflow-hidden">
              <div className="aspect-square animate-shimmer" />
            </div>

            {/* Price History Chart */}
            <div className="br-card px-4 py-4 md:px-5 md:py-5">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="h-5 w-32 rounded animate-shimmer" />
                <div className="h-5 w-12 rounded animate-shimmer" />
              </div>
              <div className="h-[250px] md:h-[300px] rounded animate-shimmer" />
            </div>
          </div>

          {/* Right Column: Action Panel and Metadata */}
          <div className="lg:col-span-5 flex flex-col gap-4 md:gap-6">
            {/* Action Panel */}
            <div className="hidden md:block br-card p-4 md:p-5">
              <div className="flex flex-col gap-3">
                <div className="h-5 w-24 rounded animate-shimmer" />
                <div className="h-10 w-full rounded animate-shimmer" />
                <div className="h-10 w-full rounded animate-shimmer" />
              </div>
            </div>

            {/* Metadata Panel */}
            <div className="br-card p-4 md:p-5">
              <div className="h-5 w-28 rounded animate-shimmer mb-4" />
              <div className="flex flex-col gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="h-3 w-24 rounded animate-shimmer" />
                    <div className="h-3 w-32 rounded animate-shimmer" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* More from this Pattern */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 mt-8 md:mt-16">
        <div className="h-6 w-52 rounded animate-shimmer mb-4 md:mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="br-card flex flex-col overflow-hidden p-0">
              <div className="flex items-center px-2.5 py-1.5 md:px-3 md:py-2">
                <div className="h-3 w-24 rounded animate-shimmer" />
              </div>
              <div className="relative mx-2 aspect-square rounded-lg bg-[#090c11] overflow-hidden">
                <div className="absolute inset-0 animate-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
