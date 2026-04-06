import { NextRequest, NextResponse } from "next/server";

const BITMAP_INDEX_API =
  process.env.BITMAP_INDEX_API_BASE ?? "http://localhost:3002";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const upstream = new URL(`${BITMAP_INDEX_API}/api/portfolio/mine`);
    searchParams.forEach((v, k) => upstream.searchParams.set(k, v));

    const upstreamHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };
    // Forward auth credentials
    const cookie = req.headers.get("cookie");
    if (cookie) upstreamHeaders["cookie"] = cookie;
    const auth = req.headers.get("authorization");
    if (auth) upstreamHeaders["authorization"] = auth;
    // Forward conditional request headers for ETag revalidation
    const ifNoneMatch = req.headers.get("if-none-match");
    if (ifNoneMatch) upstreamHeaders["if-none-match"] = ifNoneMatch;
    const ifModifiedSince = req.headers.get("if-modified-since");
    if (ifModifiedSince) upstreamHeaders["if-modified-since"] = ifModifiedSince;

    const res = await fetch(upstream.toString(), { headers: upstreamHeaders });

    // Pass 304 through with ETag + Cache-Control intact
    if (res.status === 304) {
      const headers = new Headers();
      const etag = res.headers.get("etag");
      const cc = res.headers.get("cache-control");
      if (etag) headers.set("etag", etag);
      if (cc) headers.set("cache-control", cc);
      return new NextResponse(null, { status: 304, headers });
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const responseHeaders: Record<string, string> = {};
    const etag = res.headers.get("etag");
    const cc = res.headers.get("cache-control");
    if (etag) responseHeaders["etag"] = etag;
    // Always enforce private caching — never let a CDN store authenticated data
    responseHeaders["cache-control"] = cc ?? "private, max-age=600";

    return NextResponse.json(data, { headers: responseHeaders });
  } catch {
    return NextResponse.json({ error: "Upstream unreachable" }, { status: 502 });
  }
}
