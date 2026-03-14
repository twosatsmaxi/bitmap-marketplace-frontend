import { NextRequest, NextResponse } from "next/server";

const RENDER_API = process.env.NEXT_PUBLIC_RENDER_API_BASE ?? "http://localhost:3000";

export async function GET(
  _req: NextRequest,
  { params }: { params: { height: string } }
) {
  const { height } = params;
  const url = `${RENDER_API}/api/block/${height}`;

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
  } catch (e) {
    return NextResponse.json({ error: "Upstream unreachable" }, { status: 502 });
  }
}
