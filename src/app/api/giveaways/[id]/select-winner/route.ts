import { NextRequest, NextResponse } from "next/server";
import {
  giveawayIdParamSchema,
  selectWinnerBodySchema,
  validationError,
} from "../../../../../lib/validation";

const BITMAP_INDEX_API =
  process.env.BITMAP_INDEX_API_BASE ?? "http://localhost:3002";

/** POST /api/giveaways/[id]/select-winner — select giveaway winner (auth, owner-only) */
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
    const paramParsed = giveawayIdParamSchema.safeParse({ id });
    if (!paramParsed.success) {
      return NextResponse.json(validationError(paramParsed.error), { status: 400 });
    }

    const body = await req.json();
    const bodyParsed = selectWinnerBodySchema.safeParse(body);
    if (!bodyParsed.success) {
      return NextResponse.json(validationError(bodyParsed.error), { status: 400 });
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (authHeader) headers["Authorization"] = authHeader;
    if (cookieHeader) headers["Cookie"] = cookieHeader;

    const res = await fetch(
      `${BITMAP_INDEX_API}/giveaways/${paramParsed.data.id}/select-winner`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(bodyParsed.data),
      }
    );

    const data = await res.json();
    const response = NextResponse.json(data, { status: res.status });
    for (const cookie of res.headers.getSetCookie()) {
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
