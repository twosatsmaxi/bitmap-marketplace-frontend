import { NextRequest, NextResponse } from "next/server";
import {
  challengeQuerySchema,
  searchParamsToObject,
  validationError,
} from "../../../../lib/validation";

const BITMAP_INDEX_API =
  process.env.BITMAP_INDEX_API_BASE ?? "http://localhost:3002";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const parsed = challengeQuerySchema.safeParse(searchParamsToObject(searchParams));
  if (!parsed.success) {
    return NextResponse.json(validationError(parsed.error), { status: 400 });
  }
  const { address } = parsed.data;

  try {
    const res = await fetch(
      `${BITMAP_INDEX_API}/api/auth/challenge?address=${encodeURIComponent(address)}`
    );
    const data = await res.json();
    return NextResponse.json(data, {
      status: res.status,
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch {
    return NextResponse.json(
      { error: "Upstream unreachable" },
      { status: 502 }
    );
  }
}
