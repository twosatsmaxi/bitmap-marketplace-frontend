import { NextRequest, NextResponse } from "next/server";

const BITMAP_INDEX_API =
  process.env.BITMAP_INDEX_API_BASE ?? "http://localhost:3002";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const upstream = new URL(`${BITMAP_INDEX_API}/api/portfolio/mine`);
    searchParams.forEach((v, k) => upstream.searchParams.set(k, v));

    const res = await fetch(upstream.toString(), {
      headers: {
        "Content-Type": "application/json",
        // Forward cookie so the backend can validate the JWT
        ...(req.headers.get("cookie")
          ? { cookie: req.headers.get("cookie")! }
          : {}),
        // Forward Authorization header if present
        ...(req.headers.get("authorization")
          ? { authorization: req.headers.get("authorization")! }
          : {}),
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Upstream unreachable" }, { status: 502 });
  }
}
