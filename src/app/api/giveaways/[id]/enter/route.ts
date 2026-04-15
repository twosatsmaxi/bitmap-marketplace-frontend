import { NextRequest, NextResponse } from "next/server";
import {
  enterGiveawayBodySchema,
  giveawayIdParamSchema,
  validationError,
} from "../../../../../lib/validation";

const BITMAP_INDEX_API =
  process.env.BITMAP_INDEX_API_BASE ?? "http://localhost:3002";

/** POST /api/giveaways/[id]/enter — enter a giveaway (public) */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const paramParsed = giveawayIdParamSchema.safeParse({ id });
    if (!paramParsed.success) {
      return NextResponse.json(validationError(paramParsed.error), { status: 400 });
    }

    const body = await req.json();
    const bodyParsed = enterGiveawayBodySchema.safeParse(body);
    if (!bodyParsed.success) {
      return NextResponse.json(validationError(bodyParsed.error), { status: 400 });
    }

    const res = await fetch(
      `${BITMAP_INDEX_API}/giveaways/${paramParsed.data.id}/enter`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyParsed.data),
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
