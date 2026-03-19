import { NextRequest, NextResponse } from "next/server";

const BITMAP_INDEX_API = process.env.BITMAP_INDEX_API_BASE ?? "http://localhost:3000";

// Simple in-memory cache for explore blocks (reduces backend load)
const cache = new Map<string, { data: unknown; status: number; timestamp: number }>();
const CACHE_TTL_MS = 30_000; // 30 seconds
const ERROR_CACHE_TTL_MS = 10_000; // Cache errors for 10s to prevent hammering

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cacheKey = searchParams.toString();

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

  // Forward request to bitmap-marketplace backend API
  const backendUrl = `${BITMAP_INDEX_API}/api/explore/blocks?${cacheKey}`;

  try {
    const res = await fetch(backendUrl, {
      headers: { "Accept-Encoding": "identity" },
    });

    if (!res.ok) {
      // Cache error responses (especially 429) to avoid hammering upstream
      const errorData = { error: `Upstream ${res.status}` };
      cache.set(cacheKey, { data: errorData, status: res.status, timestamp: Date.now() });
      return NextResponse.json(errorData, { status: res.status });
    }

    const data = await res.json();

    // Store in cache
    cache.set(cacheKey, { data, status: 200, timestamp: Date.now() });
    
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
