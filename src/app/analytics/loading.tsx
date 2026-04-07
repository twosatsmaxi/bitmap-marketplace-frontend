export default function AnalyticsLoading() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 md:py-8">
        {/* Header */}
        <section className="home-panel relative overflow-hidden px-4 py-4 md:px-7 md:py-6 mb-4 md:mb-8">
          <div className="relative z-10">
            <div className="h-3 w-28 rounded animate-shimmer mb-2" />
            <div className="h-8 w-44 rounded animate-shimmer md:h-10 md:w-60" />
            <div className="mt-2 h-4 w-80 rounded animate-shimmer hidden md:block" />
          </div>
        </section>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="home-panel p-4 md:p-5">
              <div className="h-3 w-20 rounded animate-shimmer mb-3" />
              <div className="h-7 w-28 rounded animate-shimmer mb-2" />
              <div className="h-3 w-14 rounded animate-shimmer" />
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-8">
          <div className="home-panel p-4 md:p-6">
            <div className="h-5 w-44 rounded animate-shimmer mb-4 md:mb-6" />
            <div className="h-[220px] md:h-[280px] lg:h-[350px] rounded animate-shimmer" />
          </div>
          <div className="home-panel p-4 md:p-6">
            <div className="h-5 w-36 rounded animate-shimmer mb-4 md:mb-6" />
            <div className="h-[220px] md:h-[280px] lg:h-[350px] rounded animate-shimmer" />
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-2 home-panel p-4 md:p-6">
            <div className="h-5 w-44 rounded animate-shimmer mb-4 md:mb-6" />
            <div className="h-[220px] md:h-[280px] lg:h-[300px] rounded animate-shimmer" />
          </div>
          <div className="home-panel p-4 md:p-6">
            <div className="h-5 w-24 rounded animate-shimmer mb-4 md:mb-6" />
            <div className="h-[250px] md:h-[280px] lg:h-[300px] rounded animate-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}
