import {
  cn,
  formatBTC,
  formatSats,
  truncateAddr,
  truncateInscription,
  formatNumber,
  abbreviateNumber,
  formatPercent,
  timeAgo,
} from "@/lib/utils";

// ---------------------------------------------------------------------------
// cn
// ---------------------------------------------------------------------------
describe("cn", () => {
  it("merges simple class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("handles conditional classes via clsx syntax", () => {
    expect(cn("base", false && "hidden", "extra")).toBe("base extra");
  });

  it("resolves Tailwind conflicts via twMerge", () => {
    // twMerge should keep the last conflicting utility
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("handles empty / undefined / null inputs gracefully", () => {
    expect(cn("", undefined, null, "ok")).toBe("ok");
  });

  it("returns empty string when given no arguments", () => {
    expect(cn()).toBe("");
  });

  it("accepts arrays (clsx feature)", () => {
    expect(cn(["a", "b"], "c")).toBe("a b c");
  });
});

// ---------------------------------------------------------------------------
// formatBTC
// ---------------------------------------------------------------------------
describe("formatBTC", () => {
  it("formats >= 1 BTC with 4 decimal places", () => {
    expect(formatBTC(100_000_000)).toBe("1.0000 BTC");
    expect(formatBTC(250_000_000)).toBe("2.5000 BTC");
  });

  it("formats >= 0.001 BTC with 5 decimal places", () => {
    // 0.001 BTC = 100_000 sats
    expect(formatBTC(100_000)).toBe("0.00100 BTC");
    expect(formatBTC(500_000)).toBe("0.00500 BTC");
  });

  it("formats < 0.001 BTC with 8 decimal places", () => {
    expect(formatBTC(1)).toBe("0.00000001 BTC");
    expect(formatBTC(99_999)).toBe("0.00099999 BTC");
  });

  it("handles zero sats", () => {
    expect(formatBTC(0)).toBe("0.00000000 BTC");
  });

  it("handles exact boundary at 0.001 BTC (100_000 sats)", () => {
    expect(formatBTC(100_000)).toBe("0.00100 BTC");
  });

  it("handles exact boundary at 1 BTC (100_000_000 sats)", () => {
    expect(formatBTC(100_000_000)).toBe("1.0000 BTC");
  });
});

// ---------------------------------------------------------------------------
// formatSats
// ---------------------------------------------------------------------------
describe("formatSats", () => {
  it("formats >= 1M as X.XXM sats", () => {
    expect(formatSats(1_000_000)).toBe("1.00M sats");
    expect(formatSats(2_500_000)).toBe("2.50M sats");
    expect(formatSats(10_000_000)).toBe("10.00M sats");
  });

  it("formats >= 1K as X.XK sats", () => {
    expect(formatSats(1_000)).toBe("1.0K sats");
    expect(formatSats(1_500)).toBe("1.5K sats");
    expect(formatSats(999_999)).toBe("1000.0K sats");
  });

  it("formats < 1K as N sats", () => {
    expect(formatSats(0)).toBe("0 sats");
    expect(formatSats(1)).toBe("1 sats");
    expect(formatSats(999)).toBe("999 sats");
  });
});

// ---------------------------------------------------------------------------
// truncateAddr
// ---------------------------------------------------------------------------
describe("truncateAddr", () => {
  it("truncates long addresses with default start=6, end=4", () => {
    const addr = "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4";
    const result = truncateAddr(addr);
    expect(result).toBe("bc1qw5\u2026f3t4");
    expect(result).toContain("\u2026");
  });

  it("returns short addresses as-is when length <= start + end", () => {
    expect(truncateAddr("abcdefghij")).toBe("abcdefghij"); // 10 chars = 6+4
  });

  it("returns address as-is when shorter than start + end", () => {
    expect(truncateAddr("short")).toBe("short");
  });

  it("handles custom start and end parameters", () => {
    const addr = "1234567890abcdef";
    expect(truncateAddr(addr, 4, 4)).toBe("1234\u2026cdef");
  });

  it("returns as-is when exactly start + end length", () => {
    expect(truncateAddr("1234567890", 6, 4)).toBe("1234567890");
  });
});

// ---------------------------------------------------------------------------
// truncateInscription
// ---------------------------------------------------------------------------
describe("truncateInscription", () => {
  it("returns short IDs as-is when <= 16 chars", () => {
    expect(truncateInscription("abc123")).toBe("abc123");
    expect(truncateInscription("1234567890123456")).toBe("1234567890123456"); // exactly 16
  });

  it("truncates IDs longer than 16 chars: first 8 + \u2026 + last 8", () => {
    const id = "abcdefgh12345678ijklmnop";
    expect(truncateInscription(id)).toBe("abcdefgh\u2026ijklmnop");
  });

  it("works with typical inscription IDs (64-char hex + i0)", () => {
    const inscId =
      "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2i0";
    const result = truncateInscription(inscId);
    expect(result.length).toBe(17); // 8 + 1 (ellipsis) + 8
    // first 8 = "a1b2c3d4", last 8 = "f6a1b2i0"
    expect(result).toBe("a1b2c3d4\u2026f6a1b2i0");
  });
});

// ---------------------------------------------------------------------------
// formatNumber
// ---------------------------------------------------------------------------
describe("formatNumber", () => {
  it("formats numbers with en-US commas", () => {
    expect(formatNumber(1500)).toBe("1,500");
    expect(formatNumber(1_000_000)).toBe("1,000,000");
  });

  it("handles zero", () => {
    expect(formatNumber(0)).toBe("0");
  });

  it("handles small numbers without commas", () => {
    expect(formatNumber(42)).toBe("42");
    expect(formatNumber(999)).toBe("999");
  });

  it("handles negative numbers", () => {
    expect(formatNumber(-1500)).toBe("-1,500");
  });
});

// ---------------------------------------------------------------------------
// abbreviateNumber
// ---------------------------------------------------------------------------
describe("abbreviateNumber", () => {
  it("abbreviates >= 10K with no decimal (rounded)", () => {
    expect(abbreviateNumber(10_000)).toBe("10K");
    expect(abbreviateNumber(25_000)).toBe("25K");
    expect(abbreviateNumber(15_432)).toBe("15K");
  });

  it("abbreviates >= 1K with one decimal", () => {
    expect(abbreviateNumber(1_000)).toBe("1.0K");
    expect(abbreviateNumber(1_500)).toBe("1.5K");
    expect(abbreviateNumber(9_999)).toBe("10.0K");
  });

  it("returns raw number for < 1K", () => {
    expect(abbreviateNumber(0)).toBe("0");
    expect(abbreviateNumber(500)).toBe("500");
    expect(abbreviateNumber(999)).toBe("999");
  });

  it("appends suffix when provided", () => {
    expect(abbreviateNumber(25_000, " sats")).toBe("25K sats");
    expect(abbreviateNumber(1_500, " sats")).toBe("1.5K sats");
    expect(abbreviateNumber(42, " sats")).toBe("42 sats");
  });
});

// ---------------------------------------------------------------------------
// formatPercent
// ---------------------------------------------------------------------------
describe("formatPercent", () => {
  it("prefixes positive numbers with +", () => {
    expect(formatPercent(5.23)).toBe("+5.23%");
    expect(formatPercent(0.1)).toBe("+0.10%");
  });

  it("keeps - for negative numbers", () => {
    expect(formatPercent(-2.1)).toBe("-2.10%");
    expect(formatPercent(-0.5)).toBe("-0.50%");
  });

  it("treats zero as positive (+0.00%)", () => {
    expect(formatPercent(0)).toBe("+0.00%");
  });

  it("formats to exactly 2 decimal places", () => {
    expect(formatPercent(1)).toBe("+1.00%");
    expect(formatPercent(3.456)).toBe("+3.46%");
  });
});

// ---------------------------------------------------------------------------
// timeAgo
// ---------------------------------------------------------------------------
describe("timeAgo", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Fix "now" to a known date
    vi.setSystemTime(new Date("2026-04-04T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for < 60 seconds ago', () => {
    expect(timeAgo("2026-04-04T11:59:30Z")).toBe("just now");
    expect(timeAgo("2026-04-04T11:59:01Z")).toBe("just now");
  });

  it('returns "Xm ago" for < 60 minutes', () => {
    expect(timeAgo("2026-04-04T11:59:00Z")).toBe("1m ago");
    expect(timeAgo("2026-04-04T11:30:00Z")).toBe("30m ago");
    expect(timeAgo("2026-04-04T11:01:00Z")).toBe("59m ago");
  });

  it('returns "Xh ago" for < 24 hours', () => {
    expect(timeAgo("2026-04-04T11:00:00Z")).toBe("1h ago");
    expect(timeAgo("2026-04-04T00:00:00Z")).toBe("12h ago");
    expect(timeAgo("2026-04-03T13:00:00Z")).toBe("23h ago");
  });

  it('returns "Xd ago" for >= 24 hours', () => {
    expect(timeAgo("2026-04-03T12:00:00Z")).toBe("1d ago");
    expect(timeAgo("2026-03-28T12:00:00Z")).toBe("7d ago");
    expect(timeAgo("2026-03-05T12:00:00Z")).toBe("30d ago");
  });

  it("handles exact boundary at 60 seconds (should be 1m ago)", () => {
    expect(timeAgo("2026-04-04T11:59:00Z")).toBe("1m ago");
  });
});
