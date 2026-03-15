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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter") || "all";
  const page = parseInt(searchParams.get("page") || "0", 10);
  const limit = parseInt(searchParams.get("limit") || "9", 10);
  const offset = page * limit;

  let heights: number[] = [];

  if (filter === "punks") {
    // blocks where height % 4 === 3
    // We start from 0 and find the first page of matches
    // This is inefficient for real use but matches the stub requirement
    for (let i = offset * 4; heights.length < limit && i < 1_000_000; i++) {
      if (i % 4 === 3) heights.push(i);
    }
  } else if (filter === "palindrome") {
    // This would be slow to calculate on the fly for deep pages
    // For now, let's just find some palindromes starting from offset
    let current = offset;
    while (heights.length < limit && current < 1_000_000) {
      if (isPalindrome(current)) {
        heights.push(current);
      }
      current++;
    }
  } else if (filter === "sub-100k") {
    for (let i = offset; i < offset + limit && i < 100_000; i++) {
      heights.push(i);
    }
  } else if (filter === "nakamoto") {
    for (let i = offset; i < offset + limit && i < 36_288; i++) {
      heights.push(i);
    }
  } else if (filter === "repdigit") {
    const allRepdigits: number[] = [];
    for (let digits = 1; digits <= 6; digits++) {
      for (let d = 1; d <= 9; d++) {
        allRepdigits.push(Number(String(d).repeat(digits)));
      }
    }
    allRepdigits.sort((a, b) => a - b);
    heights = allRepdigits.slice(offset, offset + limit);
  } else if (STUB_DATA[filter]) {
    heights = STUB_DATA[filter].slice(offset, offset + limit);
  }

  const hasMore = heights.length === limit;
  const hasPrev = page > 0;

  return NextResponse.json({
    heights,
    hasMore,
    hasPrev,
  });
}
