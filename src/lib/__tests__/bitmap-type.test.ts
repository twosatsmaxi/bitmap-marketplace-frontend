import { getBitmapType, getBitmapRarity } from "@/lib/bitmap-type";

// ---------------------------------------------------------------------------
// getBitmapType
// ---------------------------------------------------------------------------
describe("getBitmapType", () => {
  describe("palindrome detection", () => {
    it("identifies single-digit numbers as palindromes", () => {
      for (let n = 0; n <= 9; n++) {
        expect(getBitmapType(n)).toBe("palindrome");
      }
    });

    it("identifies multi-digit palindromes", () => {
      expect(getBitmapType(121)).toBe("palindrome");
      expect(getBitmapType(12321)).toBe("palindrome");
      expect(getBitmapType(1001)).toBe("palindrome");
      expect(getBitmapType(11)).toBe("palindrome");
    });

    it("does not misidentify non-palindromes", () => {
      expect(getBitmapType(12)).not.toBe("palindrome");
      expect(getBitmapType(123)).not.toBe("palindrome");
      expect(getBitmapType(10)).not.toBe("palindrome");
    });
  });

  describe("modulo mapping (non-palindromes)", () => {
    it("maps blockNumber % 4 === 0 to city", () => {
      expect(getBitmapType(12)).toBe("city"); // 12 % 4 === 0
      expect(getBitmapType(100)).toBe("city"); // 100 % 4 === 0
    });

    it("maps blockNumber % 4 === 1 to grid", () => {
      expect(getBitmapType(13)).toBe("grid"); // 13 % 4 === 1
      expect(getBitmapType(21)).toBe("grid"); // 21 % 4 === 1
    });

    it("maps blockNumber % 4 === 2 to mondrian", () => {
      expect(getBitmapType(10)).toBe("mondrian"); // 10 % 4 === 2
      expect(getBitmapType(42)).toBe("mondrian"); // 42 % 4 === 2
    });

    it("maps blockNumber % 4 === 3 to punk", () => {
      expect(getBitmapType(23)).toBe("punk"); // 23 % 4 === 3
      expect(getBitmapType(43)).toBe("punk"); // 43 % 4 === 3
    });
  });

  it("palindrome takes priority over modulo mapping", () => {
    // 121 % 4 === 1, which would be "grid", but it's a palindrome
    expect(getBitmapType(121)).toBe("palindrome");
    // 1001 % 4 === 1, which would be "grid", but it's a palindrome
    expect(getBitmapType(1001)).toBe("palindrome");
  });
});

// ---------------------------------------------------------------------------
// getBitmapRarity
// ---------------------------------------------------------------------------
describe("getBitmapRarity", () => {
  describe("early block tiers", () => {
    it('returns "legendary" for blocks < 1000', () => {
      expect(getBitmapRarity(0)).toBe("legendary");
      expect(getBitmapRarity(1)).toBe("legendary");
      expect(getBitmapRarity(999)).toBe("legendary");
    });

    it('returns "epic" for blocks >= 1000 and < 10_000', () => {
      expect(getBitmapRarity(1000)).toBe("epic");
      expect(getBitmapRarity(5000)).toBe("epic");
      expect(getBitmapRarity(9999)).toBe("epic");
    });

    it('returns "rare" for blocks >= 10_000 and < 100_000', () => {
      expect(getBitmapRarity(10_000)).toBe("rare");
      expect(getBitmapRarity(50_000)).toBe("rare");
      expect(getBitmapRarity(99_999)).toBe("rare");
    });
  });

  describe("palindromes (>= 100_000)", () => {
    it('returns "uncommon" for palindromic block numbers', () => {
      expect(getBitmapRarity(100_001)).toBe("uncommon");
      expect(getBitmapRarity(123_321)).toBe("uncommon");
      expect(getBitmapRarity(102_201)).toBe("uncommon");
    });
  });

  describe("round numbers (>= 100_000, non-palindrome)", () => {
    it('returns "rare" for multiples of 10_000', () => {
      expect(getBitmapRarity(100_000)).toBe("rare");
      expect(getBitmapRarity(200_000)).toBe("rare");
      expect(getBitmapRarity(500_000)).toBe("rare");
    });

    it('returns "uncommon" for multiples of 1000 (not 10_000)', () => {
      expect(getBitmapRarity(101_000)).toBe("uncommon");
      expect(getBitmapRarity(123_000)).toBe("uncommon");
      expect(getBitmapRarity(999_000)).toBe("uncommon");
    });
  });

  describe("common blocks", () => {
    it('returns "common" for non-special blocks >= 100_000', () => {
      expect(getBitmapRarity(100_002)).toBe("common");
      expect(getBitmapRarity(123_456)).toBe("common");
      expect(getBitmapRarity(800_001)).toBe("common");
    });
  });

  describe("boundary cases", () => {
    it("boundary at 999/1000", () => {
      expect(getBitmapRarity(999)).toBe("legendary");
      expect(getBitmapRarity(1000)).toBe("epic");
    });

    it("boundary at 9999/10_000", () => {
      expect(getBitmapRarity(9999)).toBe("epic");
      expect(getBitmapRarity(10_000)).toBe("rare");
    });

    it("boundary at 99_999/100_000", () => {
      expect(getBitmapRarity(99_999)).toBe("rare");
      // 100_000 is a multiple of 10_000 → rare
      expect(getBitmapRarity(100_000)).toBe("rare");
    });
  });

  describe("priority ordering", () => {
    it("early block tier takes precedence over palindrome", () => {
      // 121 is a palindrome AND < 1000 → legendary (early block wins)
      expect(getBitmapRarity(121)).toBe("legendary");
      // 1001 is a palindrome AND < 10_000 → epic (early block wins)
      expect(getBitmapRarity(1001)).toBe("epic");
    });

    it("palindrome takes precedence over round-number rules", () => {
      // If a number >= 100_000 is both palindrome and multiple of 1000,
      // palindrome check comes first
      // 100_001 is a palindrome, should be "uncommon" from palindrome
      expect(getBitmapRarity(100_001)).toBe("uncommon");
    });
  });
});
