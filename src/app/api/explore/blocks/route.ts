import { NextRequest, NextResponse } from "next/server";

const BITMAP_INDEX_API = process.env.BITMAP_INDEX_API_BASE ?? "http://localhost:3000";

// Simple in-memory cache for explore blocks (reduces backend load)
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL_MS = 30_000; // 30 seconds

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cacheKey = searchParams.toString();
  
  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cached.data, {
      headers: { "X-Cache": "HIT" },
    });
  }

  // Forward request to bitmap-marketplace backend API
  const backendUrl = `${BITMAP_INDEX_API}/api/explore/blocks?${cacheKey}`;

  try {
    const res = await fetch(backendUrl, {
      headers: { "Accept-Encoding": "identity" },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    
    // Store in cache
    cache.set(cacheKey, { data, timestamp: Date.now() });
    
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
