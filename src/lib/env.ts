import { z } from "zod";

/**
 * Server-side environment variables — only available in API routes and server components.
 * Validated at import time to fail fast on misconfiguration.
 */
const serverSchema = z.object({
  BESTINSLOT_API_KEY: z.string().min(1).optional(),
  BITMAP_INDEX_API_BASE: z.string().url().optional().default("http://localhost:3002"),
  RENDER_API_BASE: z.string().url().optional().default("http://localhost:3020"),
});

/**
 * Public environment variables — available in both server and client code.
 * Must be prefixed with NEXT_PUBLIC_.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().optional().default("https://bitmap.trade"),
  NEXT_PUBLIC_BESTINSLOT_API_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_BITMAP_INDEX_API_BASE: z.string().optional().default(""),
  NEXT_PUBLIC_BASE_URL: z.string().url().optional().default("https://bitmap.trade"),
  NEXT_PUBLIC_BITCOIN_NETWORK: z
    .enum(["mainnet", "signet", "testnet4"])
    .optional()
    .default("mainnet"),
  NEXT_PUBLIC_MARKETPLACE_API_BASE: z
    .string()
    .url()
    .optional()
    .default("http://localhost:8080"),
});

function validateEnv() {
  const server = serverSchema.safeParse(process.env);
  const pub = publicSchema.safeParse(process.env);

  if (!server.success) {
    console.error("Invalid server environment variables:", server.error.format());
  }
  if (!pub.success) {
    console.error("Invalid public environment variables:", pub.error.format());
  }

  return {
    server: server.success ? server.data : serverSchema.parse({}),
    public: pub.success ? pub.data : publicSchema.parse({}),
  };
}

export const env = validateEnv();
