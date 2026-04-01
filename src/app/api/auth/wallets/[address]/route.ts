import { NextRequest, NextResponse } from "next/server";

const BITMAP_INDEX_API =
  process.env.BITMAP_INDEX_API_BASE ?? "http://localhost:3002";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(
      `${BITMAP_INDEX_API}/api/auth/wallets/${encodeURIComponent(address)}`,
      {
        method: "DELETE",
        headers: { Authorization: authHeader },
      }
    );

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "Upstream unreachable" },
      { status: 502 }
    );
  }
}
