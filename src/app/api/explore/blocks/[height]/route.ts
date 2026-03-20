import { NextRequest, NextResponse } from "next/server";

const BITMAP_INDEX_API = process.env.BITMAP_INDEX_API_BASE ?? "http://localhost:3000";

// Generate mock transactions for a block
function generateMockTransactions(height: number, count: number) {
  return Array.from({ length: count }, (_, i) => ({
    txid: `${height}_${i}_${Math.random().toString(36).substring(2, 15)}`,
    size: 150 + Math.floor(Math.random() * 2000),
    fee: Math.floor(Math.random() * 100000),
    inputs: 1 + Math.floor(Math.random() * 5),
    outputs: 1 + Math.floor(Math.random() * 3),
  }));
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ height: string }> }
) {
  const { height } = await params;
  const blockHeight = parseInt(height, 10);

  if (isNaN(blockHeight)) {
    return NextResponse.json({ error: "Invalid block height" }, { status: 400 });
  }

  try {
    // Try to fetch real block data from backend
    const res = await fetch(`${BITMAP_INDEX_API}/api/blocks/${blockHeight}`, {
      headers: { "Accept-Encoding": "identity" },
    });

    if (res.ok) {
      const data = await res.json();
      // Add mock transactions if not present
      if (!data.transactions) {
        data.transactions = generateMockTransactions(blockHeight, data.tx_count || 200);
      }
      return NextResponse.json(data);
    }
  } catch {
    console.log(`Backend unavailable for block ${blockHeight}, using mock data`);
  }

  // Fallback: Generate mock block data
  const txCount = 150 + Math.floor(Math.random() * 200);
  const mockBlock = {
    height: blockHeight,
    hash: `0000000000000000000${Math.random().toString(36).substring(2, 20)}`,
    timestamp: Date.now() / 1000 - Math.random() * 3600,
    size: txCount * 500 + Math.floor(Math.random() * 100000),
    tx_count: txCount,
    transactions: generateMockTransactions(blockHeight, txCount),
  };

  return NextResponse.json(mockBlock);
}
