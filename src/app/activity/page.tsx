import ActivityTable from "@/components/activity/ActivityTable";
import EventTypeFilter from "@/components/activity/EventTypeFilter";
import { getActivityFeed } from "@/lib/api";

export const revalidate = 30;

interface PageProps {
  searchParams: { type?: string };
}

export default async function ActivityPage({ searchParams }: PageProps) {
  const selectedType = searchParams.type || "all";
  const { events, total } = await getActivityFeed(selectedType);

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 md:py-8">
        <section className="home-panel relative overflow-hidden px-5 py-5 md:px-7 md:py-6 mb-8">
          <div className="relative z-10">
            <p className="home-eyebrow mb-2">Network activity</p>
            <h1 className="font-mono text-3xl font-black uppercase tracking-[-0.03em] text-primary md:text-4xl">
              Live Feed
            </h1>
            <p className="mt-2 max-w-md font-mono text-sm leading-6 text-zinc-400">
              Real-time synchronization of every Bitmap inscription, sale, and listing event on the protocol.
            </p>
          </div>
          
          <div className="mt-8 flex items-center justify-between border-t border-[rgba(120,72,18,0.45)] pt-6">
            <EventTypeFilter currentType={selectedType} />
            <div className="hidden md:flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-zinc-500">
              <span className="h-1.5 w-1.5 animate-pulse bg-primary"></span>
              Streaming {total.toLocaleString()} total events
            </div>
          </div>
        </section>

        <div className="home-panel overflow-hidden">
          <ActivityTable events={events} />
        </div>
      </div>
    </div>
  );
}
