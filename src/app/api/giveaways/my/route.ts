import { NextRequest, NextResponse } from "next/server";

const BITMAP_INDEX_API =
  process.env.BITMAP_INDEX_API_BASE ?? "http://localhost:3002";

/** GET /api/giveaways/my — authenticated user's giveaways */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const cookieHeader = req.headers.get("Cookie");

  if (!authHeader && !cookieHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const headers: Record<string, string> = {};
    if (authHeader) headers["Authorization"] = authHeader;
    if (cookieHeader) headers["Cookie"] = cookieHeader;

    const res = await fetch(`${BITMAP_INDEX_API}/giveaways/my`, { headers });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "Upstream unreachable" },
      { status: 502 }
    );
  }
}
