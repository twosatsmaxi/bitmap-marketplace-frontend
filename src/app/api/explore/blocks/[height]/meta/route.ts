import { NextRequest, NextResponse } from "next/server";

const RENDER_API =
  process.env.RENDER_API_BASE ?? "http://r2d2.local:3020";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ height: string }> }
) {
  const { height } = await params;
  const url = `${RENDER_API}/api/block/${height}/meta`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream ${res.status}` },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=60" },
    });
  } catch {
    return NextResponse.json(
      { error: "Upstream unreachable" },
      { status: 502 }
    );
  }
}
