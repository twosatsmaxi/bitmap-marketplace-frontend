import { NextRequest, NextResponse } from "next/server";

const BITMAP_INDEX_API =
  process.env.BITMAP_INDEX_API_BASE ?? "http://localhost:3002";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const res = await fetch(`${BITMAP_INDEX_API}/api/auth/connect`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();

    // Forward Set-Cookie header from backend
    const response = NextResponse.json(data, { status: res.status });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      response.headers.set("set-cookie", setCookie);
    }
    return response;
  } catch {
    return NextResponse.json(
      { error: "Upstream unreachable" },
      { status: 502 }
    );
  }
}
