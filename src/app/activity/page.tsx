import ActivityTable from "@/components/activity/ActivityTable";
import EventTypeFilter from "@/components/activity/EventTypeFilter";
import { getActivityFeed } from "@/lib/api";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export const revalidate = 30;

interface PageProps {
  searchParams: Promise<{ type?: string }>;
}

export default async function ActivityPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const selectedType = params.type || "all";
  const { events, total } = await getActivityFeed(selectedType);

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 md:py-8">
        {/* Header */}
        <section className="home-panel relative overflow-hidden px-4 py-4 md:px-7 md:py-6 mb-4 md:mb-8">
          <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <p className="home-eyebrow mb-2">Network activity</p>
              <h1 className="font-mono text-2xl font-black uppercase tracking-[-0.03em] text-primary md:text-4xl">
                Live Feed
              </h1>
              <p className="mt-2 max-w-md font-mono text-sm leading-6 text-zinc-400 hidden md:block">
                Real-time synchronization of every Bitmap inscription, sale, and listing event on the protocol.
              </p>
            </div>
            <Link
              href="/mempool"
              className="flex items-center gap-2 self-start px-4 py-2.5
                border border-primary/40 rounded-lg
                bg-primary/10 hover:bg-primary/20
                transition-all duration-200 group"
            >
              <Sparkles className="w-4 h-4 text-primary group-hover:animate-pulse" />
              <span className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-primary">
                Immersive View
              </span>
            </Link>
          </div>
        </section>

        {/* Filter Section */}
        <div className="mb-4 md:mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <EventTypeFilter currentType={selectedType} />
            <div className="hidden md:flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-zinc-500">
              <span className="h-1.5 w-1.5 animate-pulse bg-primary"></span>
              Streaming {total.toLocaleString()} total events
            </div>
          </div>
        </div>

        {/* Results Count - Mobile */}
        <div className="md:hidden mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-zinc-500">
          <span className="h-1.5 w-1.5 bg-primary/50"></span>
          Showing <span className="font-bold text-zinc-300">{events.length}</span> events
        </div>

        {/* Activity Table/Cards */}
        <div className="home-panel overflow-hidden">
          <ActivityTable events={events} />
        </div>
      </div>
    </div>
  );
}
