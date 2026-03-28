import { NextRequest, NextResponse } from "next/server";

const BITMAP_INDEX_API = process.env.BITMAP_INDEX_API_BASE ?? "http://localhost:3002";

// In-memory cache (same pattern as explore API route)
const CACHE_MAX = 200;
const cache = new Map<string, { data: unknown; status: number; timestamp: number }>();
const CACHE_TTL_MS = 30_000; // 30 seconds
const ERROR_CACHE_TTL_MS = 10_000; // Cache errors for 10s to prevent hammering

function cacheSet(key: string, value: { data: unknown; status: number; timestamp: number }) {
  cache.set(key, value);
  if (cache.size > CACHE_MAX) {
    const firstKey = cache.keys().next().value;
    if (firstKey !== undefined) cache.delete(firstKey);
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  const { searchParams } = new URL(req.url);

  const queryString = searchParams.toString();
  const cacheKey = `${address}:${queryString}`;

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached) {
    const ttl = cached.status === 200 ? CACHE_TTL_MS : ERROR_CACHE_TTL_MS;
    if (Date.now() - cached.timestamp < ttl) {
      return NextResponse.json(cached.data, {
        status: cached.status,
        headers: { "X-Cache": "HIT" },
      });
    }
  }

  const backendUrl = `${BITMAP_INDEX_API}/api/portfolio/${address}${queryString ? `?${queryString}` : ""}`;

  try {
    const res = await fetch(backendUrl, {
      headers: { "Accept-Encoding": "identity" },
    });

    if (!res.ok) {
      const errorData = { error: `Upstream ${res.status}` };
      cacheSet(cacheKey, { data: errorData, status: res.status, timestamp: Date.now() });
      return NextResponse.json(errorData, { status: res.status });
    }

    const data = await res.json();
    cacheSet(cacheKey, { data, status: 200, timestamp: Date.now() });

    return NextResponse.json(data, {
      headers: { "X-Cache": "MISS" },
    });
  } catch {
    return NextResponse.json(
      { error: "Upstream unreachable" },
      { status: 502 }
    );
  }
}
