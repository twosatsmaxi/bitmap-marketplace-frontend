import { getActivityFeed } from "@/lib/api";
import EventTypeFilter from "@/components/activity/EventTypeFilter";
import ActivityTable from "@/components/activity/ActivityTable";

export const revalidate = 60;

interface PageProps {
  searchParams: { type?: string };
}

export default async function ActivityPage({ searchParams }: PageProps) {
  const eventType = searchParams.type || "all";
  const { events, total } = await getActivityFeed(eventType);

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="mb-8">
          <p className="home-eyebrow mb-3">Activity feed</p>
          <h1 className="mb-4 font-mono text-3xl font-black uppercase tracking-[-0.03em] text-primary md:text-5xl">
            Market Activity
          </h1>
          <p className="max-w-2xl font-mono text-sm tracking-wide text-zinc-400">
            Live feed of sales, listings, and transfers across the Bitmap ecosystem.
          </p>
        </div>

        <div className="home-panel px-4 py-4 md:px-6 md:py-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <EventTypeFilter currentType={eventType} />
            <div className="font-mono text-sm text-zinc-500">
              Showing <span className="text-primary">{events.length}</span> events
            </div>
          </div>

          <ActivityTable events={events} />
        </div>
      </div>
    </div>
  );
}
