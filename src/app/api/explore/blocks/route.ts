import { NextRequest, NextResponse } from "next/server";

const BITMAP_INDEX_API = process.env.BITMAP_INDEX_API_BASE ?? "http://localhost:3000";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Forward request to bitmap-marketplace backend API
  // Endpoint: GET /api/explore/blocks?filter=&page=&limit=
  const backendUrl = `${BITMAP_INDEX_API}/api/explore/blocks?${searchParams.toString()}`;

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
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Upstream unreachable" },
      { status: 502 }
    );
  }
}
