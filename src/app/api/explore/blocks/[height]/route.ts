import { NextRequest, NextResponse } from "next/server";

const RENDER_API =
  process.env.RENDER_API_BASE ?? "http://r2d2.local:3020";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ height: string }> }
) {
  const { height } = await params;
  const blockHeight = parseInt(height, 10);

  if (isNaN(blockHeight) || blockHeight < 0) {
    return NextResponse.json({ error: "Invalid block height" }, { status: 400 });
  }

  try {
    const res = await fetch(`${RENDER_API}/api/block/${blockHeight}`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream ${res.status}` },
        { status: res.status }
      );
    }

    const body = await res.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Cache-Control": "public, max-age=2592000, immutable",
        "X-Block-Hash": res.headers.get("x-block-hash") ?? "",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Upstream unreachable" },
      { status: 502 }
    );
  }
}
