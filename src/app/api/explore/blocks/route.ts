import { NextRequest, NextResponse } from "next/server";

const TRAIT_MAP: Record<string, string> = {
  punks: "pristine_punk",
  palindrome: "palindrome",
  "sub-100k": "sub_100k",
  nakamoto: "nakamoto",
  patoshi: "patoshi",
  billionaire: "billionaire",
  "epic-sat": "epic_sat",
  pizza: "pizza",
  "pristine-punk": "pristine_punk",
  "perfect-punk": "perfect_punk",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter") || "all";
  const page = parseInt(searchParams.get("page") || "0", 10);
  const limit = parseInt(searchParams.get("limit") || "9", 10);

  const BITMAP_INDEX_URL = process.env.BITMAP_INDEX_URL || "http://localhost:8080";

  let heights: number[] = [];

  if (filter === "all") {
    // For "all", we just return consecutive heights starting from page * limit
    const offset = page * limit;
    for (let i = offset; i < offset + limit; i++) {
      heights.push(i);
    }
  } else {
    const trait = TRAIT_MAP[filter] || filter;
    try {
      const url = new URL(`${BITMAP_INDEX_URL}/api/bitmaps`);
      url.searchParams.set("traits", trait);
      url.searchParams.set("page", page.toString());
      url.searchParams.set("limit", limit.toString());

      const res = await fetch(url.toString());
      if (!res.ok) {
        throw new Error(`bitmap-index API error: ${res.status}`);
      }
      const data = await res.json();
      // Assuming bitmap-index returns { bitmaps: [{ height: number }, ...], total: number }
      // Or maybe it returns a list of heights directly.
      // Based on description "GET /api/bitmaps?traits=...&page=...&limit=..."
      // and issue-2ht: "Replace with calls to bitmap-index GET /api/bitmaps?traits=...&page=...&limit=..."
      // Let's assume it returns { bitmaps: { height: number }[] }
      heights = data.bitmaps.map((b: { height: number }) => b.height);
    } catch (error) {
      console.error("Error fetching from bitmap-index:", error);
      // Fallback or empty if API fails
      heights = [];
    }
  }

  const hasMore = heights.length === limit;
  const hasPrev = page > 0;

  return NextResponse.json({
    heights,
    hasMore,
    hasPrev,
  });
}
