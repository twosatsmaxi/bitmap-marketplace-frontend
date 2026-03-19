import { NextRequest, NextResponse } from "next/server";

const RENDER_API =
  process.env.RENDER_API_BASE ?? "http://r2d2.local:3020";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const heightsParam = searchParams.get("heights");

  if (!heightsParam) {
    return NextResponse.json(
      { error: "Missing heights parameter" },
      { status: 400 }
    );
  }

  const url = `${RENDER_API}/api/blocks/batch?heights=${encodeURIComponent(heightsParam)}`;

  try {
    const res = await fetch(url, {
      headers: { "Accept-Encoding": "identity" },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream ${res.status}` },
        { status: res.status }
      );
    }
    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Upstream unreachable" },
      { status: 502 }
    );
  }
}
