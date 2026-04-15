import { NextRequest, NextResponse } from "next/server";
import { giveawayIdParamSchema, validationError } from "../../../../lib/validation";

const BITMAP_INDEX_API =
  process.env.BITMAP_INDEX_API_BASE ?? "http://localhost:3002";

/** GET /api/giveaways/[id] — get giveaway details with entry count (public) */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const parsed = giveawayIdParamSchema.safeParse({ id });
    if (!parsed.success) {
      return NextResponse.json(validationError(parsed.error), { status: 400 });
    }

    const res = await fetch(
      `${BITMAP_INDEX_API}/giveaways/${parsed.data.id}`,
      { headers: { "Accept-Encoding": "identity" } }
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
