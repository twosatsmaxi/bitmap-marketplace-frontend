import { NextRequest, NextResponse } from "next/server";
import {
  giveawayClaimsQuerySchema,
  searchParamsToObject,
  validationError,
} from "../../../../lib/validation";

const BITMAP_INDEX_API =
  process.env.BITMAP_INDEX_API_BASE ?? "http://localhost:3002";

/** GET /api/giveaways/claims?address=… — claimable giveaways for an address */
export async function GET(req: NextRequest) {
  try {
    const parsed = giveawayClaimsQuerySchema.safeParse(
      searchParamsToObject(req.nextUrl.searchParams)
    );
    if (!parsed.success) {
      return NextResponse.json(validationError(parsed.error), { status: 400 });
    }

    const params = new URLSearchParams({ address: parsed.data.address });
    const res = await fetch(
      `${BITMAP_INDEX_API}/giveaways/claims?${params}`,
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
