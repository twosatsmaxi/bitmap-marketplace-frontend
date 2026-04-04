import {
  parseBinaryTxs,
  layoutBlock,
  processBlockBuffer,
} from "@/lib/blockLayout";
import type { TxSquare } from "@/lib/blockLayout";

// ---------------------------------------------------------------------------
// parseBinaryTxs
// ---------------------------------------------------------------------------
describe("parseBinaryTxs", () => {
  it("returns an empty array for an empty buffer", () => {
    const buffer = new ArrayBuffer(0);
    expect(parseBinaryTxs(buffer)).toEqual([]);
  });

  it("parses a single byte into { index: 0, size: byteValue }", () => {
    const buffer = new Uint8Array([5]).buffer;
    expect(parseBinaryTxs(buffer)).toEqual([{ index: 0, size: 5 }]);
  });

  it("maps zero-valued bytes to size 1 (minimum size)", () => {
    const buffer = new Uint8Array([0]).buffer;
    expect(parseBinaryTxs(buffer)).toEqual([{ index: 0, size: 1 }]);
  });

  it("parses multiple bytes with correct indices", () => {
    const buffer = new Uint8Array([3, 0, 7, 1]).buffer;
    const result = parseBinaryTxs(buffer);
    expect(result).toEqual([
      { index: 0, size: 3 },
      { index: 1, size: 1 }, // 0 → 1
      { index: 2, size: 7 },
      { index: 3, size: 1 },
    ]);
  });

  it("handles max byte value (255)", () => {
    const buffer = new Uint8Array([255]).buffer;
    expect(parseBinaryTxs(buffer)).toEqual([{ index: 0, size: 255 }]);
  });
});

// ---------------------------------------------------------------------------
// layoutBlock
// ---------------------------------------------------------------------------
describe("layoutBlock", () => {
  it("returns empty layout for no transactions", () => {
    const result = layoutBlock([]);
    expect(result.squares).toEqual([]);
    expect(result.layoutWidth).toBe(0);
    expect(result.usedHeight).toBe(0);
  });

  it("places a single transaction", () => {
    const result = layoutBlock([{ index: 0, size: 3 }]);
    expect(result.squares).toHaveLength(1);
    expect(result.squares[0]).toEqual({ index: 0, x: 0, y: 0, r: 3 });
    expect(result.layoutWidth).toBe(3);
    expect(result.usedHeight).toBe(3);
  });

  it("places multiple transactions without overlap", () => {
    const txs = [
      { index: 0, size: 2 },
      { index: 1, size: 2 },
      { index: 2, size: 1 },
    ];
    const result = layoutBlock(txs);

    expect(result.squares).toHaveLength(3);

    // Verify no two squares overlap
    for (let i = 0; i < result.squares.length; i++) {
      for (let j = i + 1; j < result.squares.length; j++) {
        const a = result.squares[i];
        const b = result.squares[j];
        const overlapX = a.x < b.x + b.r && a.x + a.r > b.x;
        const overlapY = a.y < b.y + b.r && a.y + a.r > b.y;
        expect(overlapX && overlapY).toBe(false);
      }
    }
  });

  it("keeps all squares within layout bounds", () => {
    const txs = [
      { index: 0, size: 3 },
      { index: 1, size: 2 },
      { index: 2, size: 1 },
      { index: 3, size: 4 },
    ];
    const result = layoutBlock(txs);

    for (const sq of result.squares) {
      expect(sq.x).toBeGreaterThanOrEqual(0);
      expect(sq.y).toBeGreaterThanOrEqual(0);
      expect(sq.x + sq.r).toBeLessThanOrEqual(result.layoutWidth);
    }
  });

  it("preserves the index from input transactions", () => {
    const txs = [
      { index: 5, size: 2 },
      { index: 10, size: 1 },
    ];
    const result = layoutBlock(txs);
    const indices = result.squares.map((s) => s.index);
    expect(indices).toContain(5);
    expect(indices).toContain(10);
  });

  it("usedHeight reflects the actual bottom of placed squares", () => {
    const txs = [
      { index: 0, size: 2 },
      { index: 1, size: 3 },
    ];
    const result = layoutBlock(txs);
    const computedHeight = Math.max(
      ...result.squares.map((sq) => sq.y + sq.r)
    );
    expect(result.usedHeight).toBe(computedHeight);
  });
});

// ---------------------------------------------------------------------------
// processBlockBuffer
// ---------------------------------------------------------------------------
describe("processBlockBuffer", () => {
  it("returns a complete LayoutResult for an empty buffer", () => {
    const result = processBlockBuffer(new ArrayBuffer(0));
    expect(result).toEqual({
      squares: [],
      layoutWidth: 0,
      usedHeight: 0,
      txCount: 0,
    });
  });

  it("correctly reports txCount", () => {
    const buffer = new Uint8Array([1, 2, 3]).buffer;
    const result = processBlockBuffer(buffer);
    expect(result.txCount).toBe(3);
  });

  it("full pipeline: buffer -> parsed txs -> layout", () => {
    const buffer = new Uint8Array([3, 0, 2]).buffer;
    const result = processBlockBuffer(buffer);

    expect(result.txCount).toBe(3);
    expect(result.squares).toHaveLength(3);
    expect(result.layoutWidth).toBeGreaterThan(0);
    expect(result.usedHeight).toBeGreaterThan(0);

    // Zero byte should have been mapped to size 1
    const minSizeSquare = result.squares.find((s) => s.index === 1);
    expect(minSizeSquare).toBeDefined();
    expect(minSizeSquare!.r).toBe(1);
  });

  it("no squares overlap in full pipeline", () => {
    const buffer = new Uint8Array([4, 2, 3, 1, 5]).buffer;
    const result = processBlockBuffer(buffer);

    for (let i = 0; i < result.squares.length; i++) {
      for (let j = i + 1; j < result.squares.length; j++) {
        const a = result.squares[i];
        const b = result.squares[j];
        const overlapX = a.x < b.x + b.r && a.x + a.r > b.x;
        const overlapY = a.y < b.y + b.r && a.y + a.r > b.y;
        expect(overlapX && overlapY).toBe(false);
      }
    }
  });
});
