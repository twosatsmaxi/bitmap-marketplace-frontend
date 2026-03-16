import { NextRequest, NextResponse } from "next/server";

const STUB_DATA: Record<string, number[]> = {
  patoshi: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  billionaire: [123456, 234567, 345678, 456789, 567890],
  "epic-sat": [111, 222, 333, 444, 555, 666, 777, 888, 999],
  pizza: [57043, 57044, 57045, 57046, 57047, 57048],
  "pristine-punk": [100, 200, 300, 400, 500],
  "perfect-punk": [42, 69, 420, 1337]
};

function isPalindrome(n: number): boolean {
  const s = n.toString();
  return s === s.split("").reverse().join("");
}

function getHeightsForFilter(filter: string): number[] {
  if (filter === "punks") {
    // blocks where height % 4 === 3
    const heights: number[] = [];
    for (let i = 3; heights.length < 10000 && i < 1_000_000; i++) {
      if (i % 4 === 3) heights.push(i);
    }
    return heights;
  } else if (filter === "palindrome") {
    const heights: number[] = [];
    for (let i = 0; heights.length < 10000 && i < 1_000_000; i++) {
      if (isPalindrome(i)) heights.push(i);
    }
    return heights;
  } else if (filter === "sub-100k") {
    return Array.from({ length: 100_000 }, (_, i) => i);
  } else if (filter === "nakamoto") {
    return Array.from({ length: 36_288 }, (_, i) => i);
  } else if (filter === "repdigit") {
    const allRepdigits: number[] = [];
    for (let digits = 1; digits <= 6; digits++) {
      for (let d = 1; d <= 9; d++) {
        allRepdigits.push(Number(String(d).repeat(digits)));
      }
    }
    allRepdigits.sort((a, b) => a - b);
    return allRepdigits;
  } else if (STUB_DATA[filter]) {
    return STUB_DATA[filter];
  }
  return [];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  // Support both single filter (legacy) and multiple filters
  const filtersParam = searchParams.get("filters");
  const singleFilter = searchParams.get("filter");
  const filters = filtersParam ? filtersParam.split(",") : singleFilter ? [singleFilter] : [];
  
  const page = parseInt(searchParams.get("page") || "0", 10);
  const limit = parseInt(searchParams.get("limit") || "9", 10);
  const offset = page * limit;

  let heights: number[] = [];

  if (filters.length === 0) {
    // No filters - return empty (explore page handles this case)
    heights = [];
  } else if (filters.length === 1) {
    // Single filter - simple case
    heights = getHeightsForFilter(filters[0]);
  } else {
    // Multiple filters - AND logic (intersection)
    const allSets = filters.map(getHeightsForFilter);
    // Find intersection of all sets
    const firstSet = new Set(allSets[0]);
    heights = allSets[0].filter(h => allSets.every(set => set.includes(h)));
  }

  const paginatedHeights = heights.slice(offset, offset + limit);
  const hasMore = heights.length > offset + limit;
  const hasPrev = page > 0;

  return NextResponse.json({
    heights: paginatedHeights,
    hasMore,
    hasPrev,
  });
}
