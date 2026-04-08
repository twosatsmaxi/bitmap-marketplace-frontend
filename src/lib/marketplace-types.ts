/**
 * TypeScript types mirroring the Rust backend's request/response structs.
 *
 * Keep in sync with:
 * - /Users/alpesh/codebase/bitmap-marketplace/src/models/listing.rs
 * - /Users/alpesh/codebase/bitmap-marketplace/src/routes/listings.rs
 * - /Users/alpesh/codebase/bitmap-marketplace/src/routes/orders.rs
 * - /Users/alpesh/codebase/bitmap-marketplace/src/services/psbt.rs
 */

// ---------------------------------------------------------------------------
// Shared UTXO types (mirrors SpendableInputRequest / WitnessUtxoRequest)
// ---------------------------------------------------------------------------

export interface WitnessUtxoPayload {
  script_pubkey_hex: string;
  value_sats: number;
}

export interface SpendableInputPayload {
  txid: string;
  vout: number;
  value_sats: number;
  witness_utxo: WitnessUtxoPayload;
  non_witness_utxo_hex?: string;
  redeem_script_hex?: string;
  witness_script_hex?: string;
  sequence?: number;
}

// ---------------------------------------------------------------------------
// Listing types
// ---------------------------------------------------------------------------

export type ListingStatus = "active" | "sold" | "cancelled" | "expired";

export interface CreateListingPayload {
  inscription_id: string;
  price_sats: number;
  seller_address: string;
  unsigned_psbt?: string;
  /** Compressed secp256k1 pubkey (hex) to enable mempool protection. */
  seller_pubkey?: string;
  /** Required when seller_pubkey is set. */
  inscription_input?: SpendableInputPayload;
  /** Optional gas funding UTXO. */
  gas_funding_input?: SpendableInputPayload;
}

export interface ListingResponse {
  id: string;
  inscription_id: string;
  seller_address: string;
  price_sats: number;
  status: ListingStatus;
  psbt: string | null;
  created_at: string;
  updated_at: string;
  seller_pubkey: string | null;
  multisig_address: string | null;
  multisig_script: string | null;
  locking_raw_tx: string | null;
  seller_sale_sig: string | null;
  protection_status: string;
  source_marketplace: string | null;
}

export interface CreateListingResponse extends ListingResponse {
  /** Unsigned locking PSBT hex (for protected listings). */
  locking_psbt?: string;
  /** Unsigned sale template PSBT hex (for protected listings). */
  sale_template_psbt?: string;
}

export interface SubmitLockingPayload {
  signed_locking_psbt: string;
  signed_sale_template_psbt: string;
}

export interface SubmitLockingResponse {
  listing_id: string;
  protection_status: string;
  message: string;
}

export interface ListingQueryParams {
  limit?: number;
  offset?: number;
  seller_address?: string;
  min_price_sats?: number;
  max_price_sats?: number;
  sort_by?: "created_at" | "price_asc" | "price_desc";
}

// ---------------------------------------------------------------------------
// Order / Buy types
// ---------------------------------------------------------------------------

export interface BuyPayload {
  listing_id: string;
  buyer_address: string;
  buyer_funding_input?: SpendableInputPayload;
  fee_rate_sat_vb?: number;
}

export interface BuyResponse {
  psbt: string;
  estimated_fee_sats: number;
  marketplace_fee_sats: number;
  locking_txid?: string;
  protection_status: string;
}

export interface ConfirmOrderPayload {
  listing_id: string;
  signed_psbt: string;
  locking_txid?: string;
  buyer_address?: string;
}

export interface ConfirmOrderResponse {
  listing_id: string;
  status: string;
  tx_id?: string;
  sale_tx_id?: string;
  locking_tx_id?: string;
}

// ---------------------------------------------------------------------------
// Prepare endpoint (GET /api/listings/prepare)
// ---------------------------------------------------------------------------

export interface PrepareListingResponse {
  inscription_id: string;
  txid: string;
  vout: number;
  value_sats: number;
  script_pubkey_hex: string;
  owner_address: string | null;
}

// ---------------------------------------------------------------------------
// Mempool.space types
// ---------------------------------------------------------------------------

export interface MempoolUtxo {
  txid: string;
  vout: number;
  value: number;
  status: {
    confirmed: boolean;
    block_height?: number;
    block_time?: number;
  };
}

export interface RecommendedFees {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
}
