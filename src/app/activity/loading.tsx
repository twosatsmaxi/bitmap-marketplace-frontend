export default function ActivityLoading() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 md:py-8">
        {/* Header */}
        <section className="home-panel relative overflow-hidden px-4 py-4 md:px-7 md:py-6 mb-4 md:mb-8">
          <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="h-3 w-28 rounded animate-shimmer mb-2" />
              <div className="h-8 w-40 rounded animate-shimmer md:h-10 md:w-56" />
              <div className="mt-2 h-4 w-80 rounded animate-shimmer hidden md:block" />
            </div>
            <div className="h-10 w-36 rounded animate-shimmer self-start" />
          </div>
        </section>

        {/* Filter Section */}
        <div className="mb-4 md:mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-8 w-20 rounded animate-shimmer" />
              ))}
            </div>
            <div className="hidden md:block h-3 w-48 rounded animate-shimmer" />
          </div>
        </div>

        {/* Activity Table */}
        <div className="home-panel overflow-hidden">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-5 gap-4 px-4 py-3 border-b border-white/5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-3 w-16 rounded animate-shimmer" />
            ))}
          </div>

          {/* Table Rows */}
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col md:grid md:grid-cols-5 gap-2 md:gap-4 px-4 py-3 border-b border-white/5 last:border-b-0"
            >
              <div className="h-4 w-20 rounded animate-shimmer" />
              <div className="h-4 w-28 rounded animate-shimmer" />
              <div className="h-4 w-24 rounded animate-shimmer" />
              <div className="h-4 w-32 rounded animate-shimmer" />
              <div className="h-4 w-16 rounded animate-shimmer" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
