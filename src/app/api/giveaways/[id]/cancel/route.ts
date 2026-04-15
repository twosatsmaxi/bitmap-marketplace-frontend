import { NextRequest, NextResponse } from "next/server";
import { giveawayIdParamSchema, validationError } from "../../../../../lib/validation";

const BITMAP_INDEX_API =
  process.env.BITMAP_INDEX_API_BASE ?? "http://localhost:3002";

/** POST /api/giveaways/[id]/cancel — cancel giveaway (auth, owner-only) */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = req.headers.get("Authorization");
  const cookieHeader = req.headers.get("Cookie");

  if (!authHeader && !cookieHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const parsed = giveawayIdParamSchema.safeParse({ id });
    if (!parsed.success) {
      return NextResponse.json(validationError(parsed.error), { status: 400 });
    }

    const headers: Record<string, string> = {};
    if (authHeader) headers["Authorization"] = authHeader;
    if (cookieHeader) headers["Cookie"] = cookieHeader;

    const res = await fetch(
      `${BITMAP_INDEX_API}/giveaways/${parsed.data.id}/cancel`,
      { method: "POST", headers }
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
