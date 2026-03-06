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
          <h1 className="font-heading font-bold text-3xl md:text-4xl text-text-primary mb-4">
            Market Activity
          </h1>
          <p className="text-text-secondary font-mono tracking-wide max-w-2xl text-sm">
            Live feed of sales, listings, and transfers across the Bitmap ecosystem.
          </p>
        </div>

        <div className="panel-frame pixel-cut p-4 md:p-6 bg-surface/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <EventTypeFilter currentType={eventType} />
            <div className="text-sm font-mono text-text-secondary">
              Showing <span className="text-primary">{events.length}</span> events
            </div>
          </div>

          <ActivityTable events={events} />
        </div>
      </div>
    </div>
  );
}
