import { z } from "zod/v4";

// ---------------------------------------------------------------------------
// Reusable atomic schemas
// ---------------------------------------------------------------------------

/** Bitcoin address – mainnet (1…, 3…, bc1…) or testnet (tb1…) */
export const bitcoinAddressSchema = z
  .string()
  .trim()
  .regex(
    /^(bc1|tb1|[13])[a-zA-HJ-NP-Z0-9]{25,61}$/,
    "Invalid Bitcoin address format"
  );

/** Block height – non-negative integer (no upper cap; chain tip grows over time) */
export const blockHeightSchema = z
  .number()
  .int()
  .min(0, "Block height must be >= 0");

/** Pagination – page number (0-based, coerced from string) */
export const pageSchema = z.coerce
  .number()
  .int()
  .min(0)
  .default(0);

/** Pagination – limit / page size */
export const limitSchema = z.coerce
  .number()
  .int()
  .min(1)
  .max(100)
  .default(20);

/** Generic trimmed string with a max length (for user-supplied labels etc.) */
export const sanitizedString = (maxLength = 255) =>
  z.string().trim().min(1, "Must not be empty").max(maxLength);

/** Non-empty trimmed string (no length cap beyond default) */
export const nonEmptyString = z.string().trim().min(1, "Must not be empty");

// ---------------------------------------------------------------------------
// Route-level composite schemas
// ---------------------------------------------------------------------------

/** POST /api/auth/connect */
export const connectBodySchema = z.object({
  paymentAddress: bitcoinAddressSchema,
  ordinalsAddress: bitcoinAddressSchema,
  signature: nonEmptyString,
  message: nonEmptyString,
  nonce: nonEmptyString,
});

/** GET /api/auth/challenge?address=… */
export const challengeQuerySchema = z.object({
  address: bitcoinAddressSchema,
});

/** PATCH /api/auth/wallets/[address] body */
export const walletPatchBodySchema = z.object({
  label: z.string().trim().min(1, "Label must not be empty").max(20, "Label must be 20 characters or fewer"),
});

/** DELETE /api/auth/wallets/[address] – just the route param */
export const walletAddressParamSchema = z.object({
  address: bitcoinAddressSchema,
});

/** GET /api/bitmap/[height]/image query params */
export const bitmapImageQuerySchema = z.object({
  size: z.coerce.number().int().min(64).max(2048).optional(),
  style: z.enum(["default", "twitter", "square"]).optional(),
  format: z.enum(["png", "base64"]).optional(),
  watermark: z.enum(["true", "false"]).optional(),
});

/** GET /api/explore/blocks query params */
export const exploreBlocksQuerySchema = z.object({
  page: pageSchema.optional(),
  limit: limitSchema.optional(),
  sort: z.string().trim().max(50).optional(),
  filter: z.string().trim().max(200).optional(),
});

/** GET /api/portfolio/[address] query params */
export const portfolioQuerySchema = z.object({
  page: pageSchema.optional(),
  limit: limitSchema.optional(),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse search-params into a plain object for Zod.
 * Drops keys whose value is empty string so `.optional()` works correctly.
 */
export function searchParamsToObject(sp: URLSearchParams): Record<string, string> {
  const obj: Record<string, string> = {};
  sp.forEach((v, k) => {
    if (v !== "") obj[k] = v;
  });
  return obj;
}

/** Standard 400 response for validation failures */
export function validationError(error: z.ZodError) {
  return { error: "Validation failed", details: error.issues };
}
