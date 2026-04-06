import { NextRequest, NextResponse } from "next/server";

const BITMAP_INDEX_API =
  process.env.BITMAP_INDEX_API_BASE ?? "http://localhost:3002";

// In-memory cache (same pattern as [address]/route.ts)
const CACHE_MAX = 200;
const CACHE_TTL_MS = 60_000; // 60 seconds
const ERROR_CACHE_TTL_MS = 10_000;
const cache = new Map<
  string,
  { data: unknown; status: number; etag: string | null; timestamp: number }
>();

function cacheKey(profile_id: string, searchParams: URLSearchParams): string {
  return `${profile_id}:${searchParams.toString()}`;
}

function cacheSet(
  key: string,
  value: { data: unknown; status: number; etag: string | null; timestamp: number }
) {
  cache.set(key, value);
  if (cache.size > CACHE_MAX) {
    const firstKey = cache.keys().next().value;
    if (firstKey !== undefined) cache.delete(firstKey);
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ profile_id: string }> }
) {
  try {
    const { profile_id } = await params;
    const { searchParams } = new URL(req.url);
    const key = cacheKey(profile_id, searchParams);

    // Serve from in-memory cache if fresh
    const cached = cache.get(key);
    if (cached) {
      const ttl = cached.status === 200 ? CACHE_TTL_MS : ERROR_CACHE_TTL_MS;
      if (Date.now() - cached.timestamp < ttl) {
        const headers: Record<string, string> = { "x-cache": "HIT" };
        if (cached.etag) headers["etag"] = cached.etag;
        headers["cache-control"] =
          "public, max-age=60, s-maxage=300, stale-while-revalidate=60";
        return NextResponse.json(cached.data, { status: cached.status, headers });
      }
    }

    const upstream = new URL(
      `${BITMAP_INDEX_API}/api/portfolio/profile/${profile_id}`
    );
    searchParams.forEach((v, k) => upstream.searchParams.set(k, v));

    const upstreamHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };
    // Forward conditional request headers so origin can serve 304
    const ifNoneMatch = req.headers.get("if-none-match");
    if (ifNoneMatch) upstreamHeaders["if-none-match"] = ifNoneMatch;
    const ifModifiedSince = req.headers.get("if-modified-since");
    if (ifModifiedSince) upstreamHeaders["if-modified-since"] = ifModifiedSince;

    const res = await fetch(upstream.toString(), { headers: upstreamHeaders });

    // Pass 304 through — client/Cloudflare already has the data
    if (res.status === 304) {
      const headers = new Headers();
      const etag = res.headers.get("etag");
      const cc = res.headers.get("cache-control");
      if (etag) headers.set("etag", etag);
      headers.set(
        "cache-control",
        cc ?? "public, max-age=60, s-maxage=300, stale-while-revalidate=60"
      );
      return new NextResponse(null, { status: 304, headers });
    }

    if (!res.ok) {
      const errorData = { error: `Upstream ${res.status}` };
      cacheSet(key, { data: errorData, status: res.status, etag: null, timestamp: Date.now() });
      return NextResponse.json(errorData, { status: res.status, headers: { "x-cache": "MISS" } });
    }

    const data = await res.json();
    const etag = res.headers.get("etag");
    cacheSet(key, { data, status: 200, etag, timestamp: Date.now() });

    const responseHeaders: Record<string, string> = { "x-cache": "MISS" };
    if (etag) responseHeaders["etag"] = etag;
    responseHeaders["cache-control"] =
      res.headers.get("cache-control") ??
      "public, max-age=60, s-maxage=300, stale-while-revalidate=60";

    return NextResponse.json(data, { headers: responseHeaders });
  } catch {
    return NextResponse.json({ error: "Upstream unreachable" }, { status: 502 });
  }
}

export async function HEAD(
  req: NextRequest,
  { params }: { params: Promise<{ profile_id: string }> }
) {
  try {
    const { profile_id } = await params;

    const upstreamHeaders: Record<string, string> = {};
    const ifNoneMatch = req.headers.get("if-none-match");
    if (ifNoneMatch) upstreamHeaders["if-none-match"] = ifNoneMatch;

    const res = await fetch(
      `${BITMAP_INDEX_API}/api/portfolio/profile/${profile_id}`,
      { method: "HEAD", headers: upstreamHeaders }
    );

    const headers = new Headers();
    const passThrough = [
      "etag",
      "cache-control",
      "x-portfolio-addresses",
      "x-portfolio-count",
    ];
    for (const h of passThrough) {
      const val = res.headers.get(h);
      if (val) headers.set(h, val);
    }

    return new NextResponse(null, { status: res.status, headers });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
