import { NextRequest, NextResponse } from "next/server";
import {
  createGiveawayBodySchema,
  giveawayListQuerySchema,
  searchParamsToObject,
  validationError,
} from "../../../lib/validation";

const BITMAP_INDEX_API =
  process.env.BITMAP_INDEX_API_BASE ?? "http://localhost:3002";

/** GET /api/giveaways — list active giveaways (public) */
export async function GET(req: NextRequest) {
  try {
    const parsed = giveawayListQuerySchema.safeParse(
      searchParamsToObject(req.nextUrl.searchParams)
    );
    if (!parsed.success) {
      return NextResponse.json(validationError(parsed.error), { status: 400 });
    }

    const { limit, offset } = parsed.data;
    const params = new URLSearchParams();
    if (limit !== undefined) params.set("limit", String(limit));
    if (offset !== undefined) params.set("offset", String(offset));

    const res = await fetch(
      `${BITMAP_INDEX_API}/giveaways?${params}`,
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

/** POST /api/giveaways — create giveaway (auth required) */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const cookieHeader = req.headers.get("Cookie");
    if (!authHeader && !cookieHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createGiveawayBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(validationError(parsed.error), { status: 400 });
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (authHeader) headers["Authorization"] = authHeader;
    if (cookieHeader) headers["Cookie"] = cookieHeader;

    const res = await fetch(`${BITMAP_INDEX_API}/giveaways`, {
      method: "POST",
      headers,
      body: JSON.stringify(parsed.data),
    });

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
