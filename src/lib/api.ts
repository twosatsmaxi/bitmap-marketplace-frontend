import type {
  Bitmap,
  CollectionStats,
  ActivityEvent,
  PriceDataPoint,
  AnalyticsData,
  BrowseFilters,
  BrowseSort,
} from "./types";
import {
  MOCK_BITMAPS,
  MOCK_STATS,
  MOCK_ACTIVITY,
  MOCK_PRICE_HISTORY,
  MOCK_ANALYTICS,
} from "./mock-data";

const BIS_BASE = "https://api.bestinslot.xyz/v3";
const API_KEY = process.env.BESTINSLOT_API_KEY;

async function bis<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  if (!API_KEY || API_KEY === "your_key_here") {
    throw new Error("No API key configured");
  }
  const url = new URL(`${BIS_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: {
      "x-api-key": API_KEY,
      "Content-Type": "application/json",
    },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`BiS API error: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function getCollectionStats(): Promise<CollectionStats> {
  try {
    return await bis<CollectionStats>("/collection/stats", { slug: "bitmap" });
  } catch {
    return MOCK_STATS;
  }
}

export async function getBitmaps(
  _filters?: Partial<BrowseFilters>,
  _sort?: BrowseSort,
  page = 0
): Promise<{ bitmaps: Bitmap[]; total: number }> {
  try {
    const data = await bis<{ data: Bitmap[]; total: number }>(
      "/collection/inscriptions",
      { slug: "bitmap", offset: String(page * 20), limit: "20" }
    );
    return { bitmaps: data.data, total: data.total };
  } catch {
    return { bitmaps: MOCK_BITMAPS, total: MOCK_BITMAPS.length };
  }
}

export async function getBitmap(id: string): Promise<Bitmap | null> {
  try {
    return await bis<Bitmap>(`/inscription/single`, { inscription_id: id });
  } catch {
    const blockNum = parseInt(id.replace(".bitmap", ""), 10);
    return MOCK_BITMAPS.find((b) => b.blockNumber === blockNum) ?? MOCK_BITMAPS[0];
  }
}

export async function getBitmapPriceHistory(
  _inscriptionId: string
): Promise<PriceDataPoint[]> {
  try {
    return await bis<PriceDataPoint[]>("/inscription/price_history", {
      inscription_id: _inscriptionId,
    });
  } catch {
    return MOCK_PRICE_HISTORY.slice(-30);
  }
}

export async function getActivityFeed(
  eventType?: string,
  page = 0
): Promise<{ events: ActivityEvent[]; total: number }> {
  try {
    const params: Record<string, string> = {
      slug: "bitmap",
      offset: String(page * 50),
      limit: "50",
    };
    if (eventType && eventType !== "all") params.event_type = eventType;
    const data = await bis<{ data: ActivityEvent[]; total: number }>(
      "/collection/activity",
      params
    );
    return { events: data.data, total: data.total };
  } catch {
    const filtered = eventType && eventType !== "all"
      ? MOCK_ACTIVITY.filter((e) => e.eventType === eventType)
      : MOCK_ACTIVITY;
    return { events: filtered, total: filtered.length };
  }
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  try {
    const [stats, priceHistory, volumeHistory] = await Promise.all([
      getCollectionStats(),
      bis<PriceDataPoint[]>("/collection/floor_history", { slug: "bitmap" }),
      bis<PriceDataPoint[]>("/collection/volume_history", { slug: "bitmap" }),
    ]);
    return { ...MOCK_ANALYTICS, stats, priceHistory, volumeHistory };
  } catch {
    return MOCK_ANALYTICS;
  }
}

export async function getRelatedBitmaps(bitmapType: string): Promise<Bitmap[]> {
  try {
    const data = await bis<{ data: Bitmap[] }>("/collection/inscriptions", {
      slug: "bitmap",
      bitmap_type: bitmapType,
      limit: "6",
    });
    return data.data;
  } catch {
    return MOCK_BITMAPS.filter((b) => b.bitmapType === bitmapType).slice(0, 6);
  }
}
