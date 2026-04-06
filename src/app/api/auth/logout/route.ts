import { NextRequest, NextResponse } from "next/server";

const BITMAP_INDEX_API =
  process.env.BITMAP_INDEX_API_BASE ?? "http://localhost:3002";

export async function POST(req: NextRequest) {
  try {
    const headers: Record<string, string> = {};

    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const cookieHeader = req.headers.get("Cookie");
    if (cookieHeader) {
      headers["Cookie"] = cookieHeader;
    }

    const res = await fetch(`${BITMAP_INDEX_API}/api/auth/logout`, {
      method: "POST",
      headers,
    });

    const data = await res.json();

    const response = NextResponse.json(data, { status: res.status });
    const setCookies = res.headers.getSetCookie();
    for (const cookie of setCookies) {
      response.headers.append("set-cookie", cookie);
    }
    return response;
  } catch {
    return NextResponse.json(
      { error: "Upstream unreachable" },
      { status: 502 }
    );
  }
}
