import { mulberry32, randInt, randPick } from "@/components/bitmap-art/prng";

// ---------------------------------------------------------------------------
// mulberry32
// ---------------------------------------------------------------------------
describe("mulberry32", () => {
  it("is deterministic: same seed produces same sequence", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = Array.from({ length: 20 }, () => a());
    const seqB = Array.from({ length: 20 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it("different seeds produce different sequences", () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    const seqA = Array.from({ length: 10 }, () => a());
    const seqB = Array.from({ length: 10 }, () => b());
    expect(seqA).not.toEqual(seqB);
  });

  it("returns values in [0, 1)", () => {
    const rand = mulberry32(12345);
    for (let i = 0; i < 1000; i++) {
      const val = rand();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it("produces varied output (not stuck on one value)", () => {
    const rand = mulberry32(99);
    const values = new Set(Array.from({ length: 100 }, () => rand()));
    // With 100 draws, we expect many unique values
    expect(values.size).toBeGreaterThan(90);
  });

  it("handles seed 0", () => {
    const rand = mulberry32(0);
    const val = rand();
    expect(val).toBeGreaterThanOrEqual(0);
    expect(val).toBeLessThan(1);
  });

  it("handles negative seeds", () => {
    const rand = mulberry32(-1);
    const val = rand();
    expect(val).toBeGreaterThanOrEqual(0);
    expect(val).toBeLessThan(1);
  });

  it("handles large seeds", () => {
    const rand = mulberry32(2_147_483_647); // max 32-bit signed int
    const val = rand();
    expect(val).toBeGreaterThanOrEqual(0);
    expect(val).toBeLessThan(1);
  });
});

// ---------------------------------------------------------------------------
// randInt
// ---------------------------------------------------------------------------
describe("randInt", () => {
  it("returns an integer within [min, max] inclusive", () => {
    const rand = mulberry32(42);
    for (let i = 0; i < 500; i++) {
      const val = randInt(rand, 3, 7);
      expect(Number.isInteger(val)).toBe(true);
      expect(val).toBeGreaterThanOrEqual(3);
      expect(val).toBeLessThanOrEqual(7);
    }
  });

  it("returns min when min === max", () => {
    const rand = mulberry32(42);
    expect(randInt(rand, 5, 5)).toBe(5);
    expect(randInt(rand, 5, 5)).toBe(5);
  });

  it("covers the full range over many draws", () => {
    const rand = mulberry32(123);
    const seen = new Set<number>();
    for (let i = 0; i < 1000; i++) {
      seen.add(randInt(rand, 0, 4));
    }
    // All values 0-4 should appear at least once in 1000 draws
    expect(seen).toEqual(new Set([0, 1, 2, 3, 4]));
  });

  it("works with negative ranges", () => {
    const rand = mulberry32(7);
    for (let i = 0; i < 100; i++) {
      const val = randInt(rand, -5, -1);
      expect(val).toBeGreaterThanOrEqual(-5);
      expect(val).toBeLessThanOrEqual(-1);
    }
  });

  it("is deterministic for the same seed", () => {
    const a = mulberry32(99);
    const b = mulberry32(99);
    const seqA = Array.from({ length: 20 }, () => randInt(a, 0, 100));
    const seqB = Array.from({ length: 20 }, () => randInt(b, 0, 100));
    expect(seqA).toEqual(seqB);
  });
});

// ---------------------------------------------------------------------------
// randPick
// ---------------------------------------------------------------------------
describe("randPick", () => {
  it("always returns an element from the array", () => {
    const rand = mulberry32(42);
    const arr = ["alpha", "beta", "gamma", "delta"];
    for (let i = 0; i < 200; i++) {
      expect(arr).toContain(randPick(rand, arr));
    }
  });

  it("returns the only element from a single-element array", () => {
    const rand = mulberry32(42);
    expect(randPick(rand, [99])).toBe(99);
    expect(randPick(rand, [99])).toBe(99);
  });

  it("covers all elements over many draws", () => {
    const rand = mulberry32(777);
    const arr = [1, 2, 3];
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) {
      seen.add(randPick(rand, arr));
    }
    expect(seen).toEqual(new Set([1, 2, 3]));
  });

  it("works with different types", () => {
    const rand = mulberry32(42);
    const boolArr = [true, false];
    const result = randPick(rand, boolArr);
    expect(typeof result).toBe("boolean");
  });

  it("is deterministic for the same seed", () => {
    const arr = ["a", "b", "c", "d", "e"];
    const a = mulberry32(55);
    const b = mulberry32(55);
    const seqA = Array.from({ length: 20 }, () => randPick(a, arr));
    const seqB = Array.from({ length: 20 }, () => randPick(b, arr));
    expect(seqA).toEqual(seqB);
  });
});
