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
  makeMockBitmap,
} from "./mock-data";
import { headers } from "next/headers";

const BIS_BASE = "https://api.bestinslot.xyz/v3";
const API_KEY = process.env.BESTINSLOT_API_KEY;

// Bitmap-index backend API (our own backend)
const BITMAP_INDEX_BASE = process.env.BITMAP_INDEX_API_BASE || "http://localhost:3002";

/**
 * Get the base URL for API calls in server components.
 * Uses the host header to construct the URL.
 */
async function getBaseUrl(): Promise<string> {
  // In production, use the backend directly if configured
  if (process.env.BITMAP_INDEX_API_BASE) {
    return process.env.BITMAP_INDEX_API_BASE;
  }
  
  // Otherwise, use the current host (for local proxy)
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

/**
 * Response from GET /bitmap/:block_height/details
 * Fetches real bitmap data from our backend (which queries Ordinal API)
 */
export interface BitmapDetailsResponse {
  block_height: number;
  inscription_id: string;
  inscription_number: number;
  owner: string;
  traits: string[];
  children_count: number;
  genesis_height: number;
}

/**
 * Fetch bitmap details from bitmap-index backend
 * Combines DB data (inscription_id, traits) with Ordinal API data (owner, children)
 */
export async function getBitmapDetails(
  blockHeight: number
): Promise<BitmapDetailsResponse | null> {
  try {
    // Use local proxy to avoid CORS and reachability issues
    const baseUrl = await getBaseUrl();
    const url = `${baseUrl}/api/bitmap/${blockHeight}/details`;
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`Bitmap index API error: ${res.status}`);
    return res.json() as Promise<BitmapDetailsResponse>;
  } catch (error) {
    console.error("Failed to fetch bitmap details:", error);
    return null;
  }
}

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
  const bitmapMatch = id.match(/^(\d+)\.bitmap$/);
  const blockNum = bitmapMatch ? Number(bitmapMatch[1]) : Number.NaN;

  try {
    if (bitmapMatch) {
      const mockBitmap = MOCK_BITMAPS.find((b) => b.blockNumber === blockNum);
      return mockBitmap ?? makeMockBitmap(blockNum);
    }

    return await bis<Bitmap>(`/inscription/single`, { inscription_id: id });
  } catch {
    if (bitmapMatch) {
      return MOCK_BITMAPS.find((b) => b.blockNumber === blockNum) ?? makeMockBitmap(blockNum);
    }

    return MOCK_BITMAPS.find((b) => b.inscriptionId === id) ?? null;
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

// ---------------------------------------------------------------------------
// Portfolio
// ---------------------------------------------------------------------------

export interface PortfolioBitmapItem {
  block_height: number;
  inscription_id: string | null;
  inscription_num: number | null;
  tx_count: number | null;
  block_timestamp: string | null;
  traits: string[];
}

export interface PortfolioResponse {
  address: string;
  bitmaps: PortfolioBitmapItem[];
  total: number;
  page: number;
  has_more: boolean;
}

export async function getPortfolio(
  address: string,
  page = 0,
  limit = 24
): Promise<PortfolioResponse> {
  // Use local proxy to avoid CORS and reachability issues
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}/api/portfolio/${address}?page=${page}&limit=${limit}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    next: { revalidate: 60 },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`Portfolio API error: ${res.status}`);
  return res.json() as Promise<PortfolioResponse>;
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
