export default function BlockCardSkeleton() {
  return (
    <div className="br-card flex flex-col overflow-hidden p-0">
      {/* Header row */}
      <div className="flex items-center px-2.5 py-1.5 md:px-3 md:py-2">
        <div className="h-3 w-24 rounded animate-shimmer" />
      </div>

      {/* Canvas area */}
      <div className="relative mx-2 aspect-square rounded-lg bg-[#090c11] overflow-hidden">
        <div className="absolute inset-0 animate-shimmer" />
      </div>

      {/* Metadata row */}
      <div className="flex flex-col gap-0.5 md:gap-1 px-2.5 py-2 md:px-3 md:py-3">
        <div className="flex items-center justify-between">
          <div className="h-2.5 w-16 rounded animate-shimmer" />
          <div className="h-2.5 w-12 rounded animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
