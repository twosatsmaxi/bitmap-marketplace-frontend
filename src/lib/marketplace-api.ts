/**
 * Client-side API module for marketplace trading operations.
 *
 * Calls the Rust backend directly via NEXT_PUBLIC_MARKETPLACE_API_BASE
 * for listing, buying, and order endpoints. Also wraps mempool.space
 * helpers for UTXO and fee rate fetching.
 *
 * Pattern follows auth-api.ts — thin async functions with consistent
 * error handling.
 */

import { getMempoolApiBase } from "./network-config";
import type {
  CreateListingPayload,
  CreateListingResponse,
  ListingResponse,
  ListingQueryParams,
  SubmitLockingPayload,
  SubmitLockingResponse,
  BuyPayload,
  BuyResponse,
  ConfirmOrderPayload,
  ConfirmOrderResponse,
  PrepareListingResponse,
  MempoolUtxo,
  RecommendedFees,
} from "./marketplace-types";

// ---------------------------------------------------------------------------
// Base URL
// ---------------------------------------------------------------------------

const MARKETPLACE_BASE =
  process.env.NEXT_PUBLIC_MARKETPLACE_API_BASE || "http://localhost:8080";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractErrorMessage(body: string, fallback: string): string {
  try {
    const parsed = JSON.parse(body);
    if (parsed.error) return parsed.error;
    if (parsed.message) return parsed.message;
  } catch {
    /* not JSON */
  }
  return body || fallback;
}

async function marketplaceRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${MARKETPLACE_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      extractErrorMessage(body, `Request failed: ${res.status}`),
    );
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Listing endpoints
// ---------------------------------------------------------------------------

/** POST /api/listings — create a new listing. */
export async function createListing(
  payload: CreateListingPayload,
): Promise<CreateListingResponse> {
  return marketplaceRequest<CreateListingResponse>("/api/listings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** GET /api/listings — list active listings with optional filters. */
export async function getListings(
  params?: ListingQueryParams,
): Promise<{ listings: ListingResponse[] }> {
  const sp = new URLSearchParams();
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.offset != null) sp.set("offset", String(params.offset));
  if (params?.seller_address) sp.set("seller_address", params.seller_address);
  if (params?.min_price_sats != null)
    sp.set("min_price_sats", String(params.min_price_sats));
  if (params?.max_price_sats != null)
    sp.set("max_price_sats", String(params.max_price_sats));
  if (params?.sort_by) sp.set("sort_by", params.sort_by);

  const qs = sp.toString();
  return marketplaceRequest<{ listings: ListingResponse[] }>(
    `/api/listings${qs ? `?${qs}` : ""}`,
  );
}

/** GET /api/listings/:id — get a single listing. */
export async function getListing(id: string): Promise<ListingResponse> {
  return marketplaceRequest<ListingResponse>(`/api/listings/${id}`);
}

/** DELETE /api/listings/:id — cancel a listing. */
export async function cancelListing(
  id: string,
): Promise<{ status: string }> {
  return marketplaceRequest<{ status: string }>(`/api/listings/${id}`, {
    method: "DELETE",
  });
}

/** POST /api/listings/:id/submit-locking — submit signed locking + sale template PSBTs. */
export async function submitLocking(
  id: string,
  payload: SubmitLockingPayload,
): Promise<SubmitLockingResponse> {
  return marketplaceRequest<SubmitLockingResponse>(
    `/api/listings/${id}/submit-locking`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

/** GET /api/listings/prepare — get inscription UTXO data for listing creation. */
export async function prepareListing(
  inscriptionId: string,
): Promise<PrepareListingResponse> {
  return marketplaceRequest<PrepareListingResponse>(
    `/api/listings/prepare?inscription_id=${encodeURIComponent(inscriptionId)}`,
  );
}

// ---------------------------------------------------------------------------
// Order endpoints
// ---------------------------------------------------------------------------

/** POST /api/orders/buy — initiate a purchase, returns unsigned PSBT. */
export async function initiateBuy(payload: BuyPayload): Promise<BuyResponse> {
  return marketplaceRequest<BuyResponse>("/api/orders/buy", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** POST /api/orders/confirm — confirm a purchase with signed PSBT. */
export async function confirmOrder(
  payload: ConfirmOrderPayload,
): Promise<ConfirmOrderResponse> {
  return marketplaceRequest<ConfirmOrderResponse>("/api/orders/confirm", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------------
// Mempool.space helpers
// ---------------------------------------------------------------------------

const MEMPOOL_API = getMempoolApiBase();

/** Fetch confirmed UTXOs for an address from mempool.space. */
export async function fetchUtxos(address: string): Promise<MempoolUtxo[]> {
  const res = await fetch(`${MEMPOOL_API}/address/${address}/utxo`, {
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Failed to fetch UTXOs: ${res.status}`);
  const utxos: MempoolUtxo[] = await res.json();
  // Only return confirmed UTXOs for safety
  return utxos.filter((u) => u.status.confirmed);
}

/** Fetch recommended fee rates from mempool.space. */
export async function fetchRecommendedFees(): Promise<RecommendedFees> {
  const res = await fetch(`${MEMPOOL_API}/v1/fees/recommended`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`Failed to fetch fees: ${res.status}`);
  return res.json() as Promise<RecommendedFees>;
}

/** Fetch raw transaction hex (needed for non_witness_utxo in PSBT construction). */
export async function fetchTxHex(txid: string): Promise<string> {
  const res = await fetch(`${MEMPOOL_API}/tx/${txid}/hex`, {
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Failed to fetch tx hex: ${res.status}`);
  return res.text();
}
