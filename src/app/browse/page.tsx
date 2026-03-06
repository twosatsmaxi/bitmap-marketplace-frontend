import { getBitmaps } from "@/lib/api";
import BrowseClient from "@/components/browse/BrowseClient";

export const revalidate = 60;

export default async function BrowsePage() {
  const { bitmaps, total } = await getBitmaps();

  return (
    <div className="min-h-screen bg-bg">
      <BrowseClient initialBitmaps={bitmaps} total={total} />
    </div>
  );
}
