import { NextRequest, NextResponse } from "next/server";

const RENDER_API = process.env.NEXT_PUBLIC_RENDER_API_BASE ?? "http://localhost:3000";

export async function GET(
  _req: NextRequest,
  { params }: { params: { height: string } }
) {
  const { height } = params;
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
  } catch (e) {
    return NextResponse.json({ error: "Upstream unreachable" }, { status: 502 });
  }
}
