import { NextRequest, NextResponse } from "next/server";

const BITMAP_INDEX_API = process.env.BITMAP_INDEX_API_BASE ?? "http://localhost:3002";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ height: string }> }
) {
  const { height } = await params;
  const { searchParams } = req.nextUrl;
  const page = searchParams.get("page") ?? "0";
  const limit = searchParams.get("limit") ?? "20";

  const backendUrl = `${BITMAP_INDEX_API}/api/bitmap/${height}/children?page=${page}&limit=${limit}`;

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
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Upstream unreachable" },
      { status: 502 }
    );
  }
}
