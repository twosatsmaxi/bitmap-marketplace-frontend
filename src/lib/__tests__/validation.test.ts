import { z } from "zod/v4";
import {
  bitcoinAddressSchema,
  blockHeightSchema,
  pageSchema,
  limitSchema,
  connectBodySchema,
  challengeQuerySchema,
  walletPatchBodySchema,
  bitmapImageQuerySchema,
  exploreBlocksQuerySchema,
  portfolioQuerySchema,
  searchParamsToObject,
  validationError,
} from "@/lib/validation";

// ---------------------------------------------------------------------------
// bitcoinAddressSchema
// ---------------------------------------------------------------------------
describe("bitcoinAddressSchema", () => {
  it("accepts a valid bc1q (native segwit) address", () => {
    const result = bitcoinAddressSchema.safeParse(
      "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4"
    );
    expect(result.success).toBe(true);
  });

  it("accepts a valid bc1p (taproot) address", () => {
    const result = bitcoinAddressSchema.safeParse(
      "bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297"
    );
    expect(result.success).toBe(true);
  });

  it("accepts a valid legacy 1x address", () => {
    const result = bitcoinAddressSchema.safeParse(
      "1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf Na"
        .replace(" Na", "")
        // Use a known valid legacy address
        .replace("1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf", "1BpEi6DfDAUFd153wiGrvkiKW1BCXLaMna")
    );
    // Just test a straightforward known good address
    const r2 = bitcoinAddressSchema.safeParse(
      "1BpEi6DfDAUFd153wiGrvkiKW1BCXLaMna"
    );
    expect(r2.success).toBe(true);
  });

  it("accepts a valid P2SH 3x address", () => {
    const result = bitcoinAddressSchema.safeParse(
      "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy"
    );
    expect(result.success).toBe(true);
  });

  it("accepts a valid testnet tb1 address", () => {
    const result = bitcoinAddressSchema.safeParse(
      "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx"
    );
    expect(result.success).toBe(true);
  });

  it("trims leading and trailing whitespace before validating", () => {
    const result = bitcoinAddressSchema.safeParse(
      "  bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4  "
    );
    expect(result.success).toBe(true);
  });

  it("rejects an address that is too short", () => {
    const result = bitcoinAddressSchema.safeParse("bc1qshort");
    expect(result.success).toBe(false);
  });

  it("rejects an address with an invalid prefix", () => {
    const result = bitcoinAddressSchema.safeParse(
      "2BpEi6DfDAUFd153wiGrvkiKW1BCXLaMna"
    );
    expect(result.success).toBe(false);
  });

  it("rejects an address containing invalid characters (O, I, l)", () => {
    // 'O' and 'I' are excluded from base58 and bech32 character sets
    const result = bitcoinAddressSchema.safeParse(
      "1OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOl"
    );
    expect(result.success).toBe(false);
  });

  it("rejects an empty string", () => {
    const result = bitcoinAddressSchema.safeParse("");
    expect(result.success).toBe(false);
  });

  it("rejects a non-string value", () => {
    const result = bitcoinAddressSchema.safeParse(12345);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// blockHeightSchema
// ---------------------------------------------------------------------------
describe("blockHeightSchema", () => {
  it("accepts 0 (genesis block)", () => {
    expect(blockHeightSchema.safeParse(0).success).toBe(true);
  });

  it("accepts 1", () => {
    expect(blockHeightSchema.safeParse(1).success).toBe(true);
  });

  it("accepts a large block height", () => {
    expect(blockHeightSchema.safeParse(840_000).success).toBe(true);
  });

  it("rejects a negative number", () => {
    expect(blockHeightSchema.safeParse(-1).success).toBe(false);
  });

  it("rejects a non-integer float", () => {
    expect(blockHeightSchema.safeParse(1.5).success).toBe(false);
  });

  it("rejects a string that looks like a number", () => {
    expect(blockHeightSchema.safeParse("100").success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// pageSchema
// ---------------------------------------------------------------------------
describe("pageSchema", () => {
  it('coerces the string "0" to 0', () => {
    const result = pageSchema.safeParse("0");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe(0);
  });

  it('coerces the string "5" to 5', () => {
    const result = pageSchema.safeParse("5");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe(5);
  });

  it("defaults to 0 when given undefined", () => {
    const result = pageSchema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe(0);
  });

  it("accepts a numeric 0 directly", () => {
    const result = pageSchema.safeParse(0);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe(0);
  });

  it("rejects a negative value", () => {
    expect(pageSchema.safeParse(-1).success).toBe(false);
  });

  it('rejects the string "-1"', () => {
    expect(pageSchema.safeParse("-1").success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// limitSchema
// ---------------------------------------------------------------------------
describe("limitSchema", () => {
  it('coerces the string "20" to 20', () => {
    const result = limitSchema.safeParse("20");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe(20);
  });

  it("defaults to 20 when given undefined", () => {
    const result = limitSchema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe(20);
  });

  it("accepts the minimum value of 1", () => {
    const result = limitSchema.safeParse(1);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe(1);
  });

  it("accepts the maximum value of 100", () => {
    const result = limitSchema.safeParse(100);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe(100);
  });

  it("rejects 0 (below minimum)", () => {
    expect(limitSchema.safeParse(0).success).toBe(false);
  });

  it("rejects 101 (above maximum)", () => {
    expect(limitSchema.safeParse(101).success).toBe(false);
  });

  it('rejects "0"', () => {
    expect(limitSchema.safeParse("0").success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// connectBodySchema
// ---------------------------------------------------------------------------
describe("connectBodySchema", () => {
  const validBody = {
    paymentAddress: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
    ordinalsAddress: "bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297",
    signature: "HHSOMEVALIDBASE64SIGNATUREVALUE==",
    message: "Sign in to Bitmap Marketplace",
    nonce: "abc123nonce",
  };

  it("accepts a complete valid body", () => {
    expect(connectBodySchema.safeParse(validBody).success).toBe(true);
  });

  it("rejects when paymentAddress is missing", () => {
    const { paymentAddress: _, ...rest } = validBody;
    expect(connectBodySchema.safeParse(rest).success).toBe(false);
  });

  it("rejects when ordinalsAddress is missing", () => {
    const { ordinalsAddress: _, ...rest } = validBody;
    expect(connectBodySchema.safeParse(rest).success).toBe(false);
  });

  it("rejects when signature is missing", () => {
    const { signature: _, ...rest } = validBody;
    expect(connectBodySchema.safeParse(rest).success).toBe(false);
  });

  it("rejects when message is missing", () => {
    const { message: _, ...rest } = validBody;
    expect(connectBodySchema.safeParse(rest).success).toBe(false);
  });

  it("rejects when nonce is missing", () => {
    const { nonce: _, ...rest } = validBody;
    expect(connectBodySchema.safeParse(rest).success).toBe(false);
  });

  it("rejects when paymentAddress is not a valid Bitcoin address", () => {
    const result = connectBodySchema.safeParse({
      ...validBody,
      paymentAddress: "not-a-bitcoin-address",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when signature is an empty string", () => {
    const result = connectBodySchema.safeParse({ ...validBody, signature: "" });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// challengeQuerySchema
// ---------------------------------------------------------------------------
describe("challengeQuerySchema", () => {
  it("accepts a valid Bitcoin address", () => {
    const result = challengeQuerySchema.safeParse({
      address: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid address format", () => {
    const result = challengeQuerySchema.safeParse({ address: "invalid-addr" });
    expect(result.success).toBe(false);
  });

  it("rejects when address is missing", () => {
    const result = challengeQuerySchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// walletPatchBodySchema
// ---------------------------------------------------------------------------
describe("walletPatchBodySchema", () => {
  it("accepts a label of exactly 1 character", () => {
    expect(walletPatchBodySchema.safeParse({ label: "a" }).success).toBe(true);
  });

  it("accepts a label of exactly 20 characters", () => {
    expect(
      walletPatchBodySchema.safeParse({ label: "a".repeat(20) }).success
    ).toBe(true);
  });

  it("accepts a typical label string", () => {
    expect(
      walletPatchBodySchema.safeParse({ label: "My Xverse Wallet" }).success
    ).toBe(true);
  });

  it("trims whitespace before validating length", () => {
    // "  " trims to "" which fails min(1)
    expect(
      walletPatchBodySchema.safeParse({ label: "   " }).success
    ).toBe(false);
  });

  it("rejects an empty string label", () => {
    expect(walletPatchBodySchema.safeParse({ label: "" }).success).toBe(false);
  });

  it("rejects a label of 21 characters", () => {
    expect(
      walletPatchBodySchema.safeParse({ label: "a".repeat(21) }).success
    ).toBe(false);
  });

  it("rejects when label is missing", () => {
    expect(walletPatchBodySchema.safeParse({}).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// bitmapImageQuerySchema
// ---------------------------------------------------------------------------
describe("bitmapImageQuerySchema", () => {
  it("accepts an empty object (all fields optional)", () => {
    expect(bitmapImageQuerySchema.safeParse({}).success).toBe(true);
  });

  it("accepts valid size within 64–2048", () => {
    expect(bitmapImageQuerySchema.safeParse({ size: 512 }).success).toBe(true);
  });

  it("accepts the minimum size of 64", () => {
    expect(bitmapImageQuerySchema.safeParse({ size: 64 }).success).toBe(true);
  });

  it("accepts the maximum size of 2048", () => {
    expect(bitmapImageQuerySchema.safeParse({ size: 2048 }).success).toBe(true);
  });

  it("rejects size below 64", () => {
    expect(bitmapImageQuerySchema.safeParse({ size: 63 }).success).toBe(false);
  });

  it("rejects size above 2048", () => {
    expect(bitmapImageQuerySchema.safeParse({ size: 2049 }).success).toBe(false);
  });

  it("accepts valid style enum values", () => {
    for (const style of ["default", "twitter", "square"] as const) {
      expect(bitmapImageQuerySchema.safeParse({ style }).success).toBe(true);
    }
  });

  it("rejects an invalid style value", () => {
    expect(
      bitmapImageQuerySchema.safeParse({ style: "banner" }).success
    ).toBe(false);
  });

  it("accepts valid format enum values", () => {
    for (const format of ["png", "base64"] as const) {
      expect(bitmapImageQuerySchema.safeParse({ format }).success).toBe(true);
    }
  });

  it("rejects an invalid format value", () => {
    expect(
      bitmapImageQuerySchema.safeParse({ format: "jpeg" }).success
    ).toBe(false);
  });

  it('accepts watermark "true" and "false"', () => {
    expect(
      bitmapImageQuerySchema.safeParse({ watermark: "true" }).success
    ).toBe(true);
    expect(
      bitmapImageQuerySchema.safeParse({ watermark: "false" }).success
    ).toBe(true);
  });

  it("rejects an invalid watermark value", () => {
    expect(
      bitmapImageQuerySchema.safeParse({ watermark: "yes" }).success
    ).toBe(false);
  });

  it("accepts all fields together", () => {
    const result = bitmapImageQuerySchema.safeParse({
      size: 512,
      style: "twitter",
      format: "png",
      watermark: "true",
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// exploreBlocksQuerySchema
// ---------------------------------------------------------------------------
describe("exploreBlocksQuerySchema", () => {
  it("accepts an empty object", () => {
    expect(exploreBlocksQuerySchema.safeParse({}).success).toBe(true);
  });

  it("accepts valid page and limit strings (coerced)", () => {
    const result = exploreBlocksQuerySchema.safeParse({
      page: "2",
      limit: "50",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(50);
    }
  });

  it("accepts sort and filter strings", () => {
    const result = exploreBlocksQuerySchema.safeParse({
      sort: "height_desc",
      filter: "inscribed",
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// portfolioQuerySchema
// ---------------------------------------------------------------------------
describe("portfolioQuerySchema", () => {
  it("accepts an empty object", () => {
    expect(portfolioQuerySchema.safeParse({}).success).toBe(true);
  });

  it("coerces page and limit from strings", () => {
    const result = portfolioQuerySchema.safeParse({ page: "1", limit: "10" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(10);
    }
  });
});

// ---------------------------------------------------------------------------
// searchParamsToObject
// ---------------------------------------------------------------------------
describe("searchParamsToObject", () => {
  it("converts non-empty params to an object", () => {
    const sp = new URLSearchParams("page=1&limit=20");
    expect(searchParamsToObject(sp)).toEqual({ page: "1", limit: "20" });
  });

  it("drops keys whose value is an empty string", () => {
    const sp = new URLSearchParams("page=1&filter=");
    const result = searchParamsToObject(sp);
    expect(result).toEqual({ page: "1" });
    expect("filter" in result).toBe(false);
  });

  it("returns an empty object for empty URLSearchParams", () => {
    const sp = new URLSearchParams();
    expect(searchParamsToObject(sp)).toEqual({});
  });

  it("keeps all params when none are empty", () => {
    const sp = new URLSearchParams("a=1&b=2&c=3");
    expect(searchParamsToObject(sp)).toEqual({ a: "1", b: "2", c: "3" });
  });

  it("drops all params when all values are empty strings", () => {
    const sp = new URLSearchParams("a=&b=");
    expect(searchParamsToObject(sp)).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// validationError
// ---------------------------------------------------------------------------
describe("validationError", () => {
  it("returns an object with error and details keys", () => {
    const parsed = bitcoinAddressSchema.safeParse("bad-address");
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const result = validationError(parsed.error);
      expect(result).toHaveProperty("error", "Validation failed");
      expect(result).toHaveProperty("details");
      expect(Array.isArray(result.details)).toBe(true);
    }
  });

  it("includes the zod issue list in details", () => {
    const parsed = blockHeightSchema.safeParse(-1);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const result = validationError(parsed.error);
      expect(result.details).toEqual(parsed.error.issues);
      expect(result.details.length).toBeGreaterThan(0);
    }
  });

  it("details is an empty array when there are no issues (ZodError with empty issues)", () => {
    // Construct a minimal ZodError manually to test the shape contract
    const fakeError = new z.ZodError([]);
    const result = validationError(fakeError);
    expect(result).toEqual({ error: "Validation failed", details: [] });
  });
});
