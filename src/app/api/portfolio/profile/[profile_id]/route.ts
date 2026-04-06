import { NextRequest, NextResponse } from "next/server";

const BITMAP_INDEX_API =
  process.env.BITMAP_INDEX_API_BASE ?? "http://localhost:3002";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ profile_id: string }> }
) {
  try {
    const { profile_id } = await params;
    const { searchParams } = new URL(req.url);
    const upstream = new URL(
      `${BITMAP_INDEX_API}/api/portfolio/profile/${profile_id}`
    );
    searchParams.forEach((v, k) => upstream.searchParams.set(k, v));

    const res = await fetch(upstream.toString(), {
      headers: { "Content-Type": "application/json" },
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

export async function HEAD(
  req: NextRequest,
  { params }: { params: Promise<{ profile_id: string }> }
) {
  try {
    const { profile_id } = await params;
    const res = await fetch(
      `${BITMAP_INDEX_API}/api/portfolio/profile/${profile_id}`,
      { method: "HEAD" }
    );

    const headers = new Headers();
    const addresses = res.headers.get("x-portfolio-addresses");
    const count = res.headers.get("x-portfolio-count");
    if (addresses) headers.set("x-portfolio-addresses", addresses);
    if (count) headers.set("x-portfolio-count", count);

    return new NextResponse(null, { status: res.status, headers });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
