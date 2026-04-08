import { create } from "zustand";

// ---------------------------------------------------------------------------
// Listing flow steps
// ---------------------------------------------------------------------------

export type ListingStep =
  | "idle"
  | "preparing"       // GET /api/listings/prepare
  | "creating"        // POST /api/listings
  | "signing_locking" // wallet.signPsbt for locking PSBT
  | "signing_sale"    // wallet.signPsbt for sale template PSBT
  | "submitting"      // POST /api/listings/:id/submit-locking
  | "complete"
  | "error";

// ---------------------------------------------------------------------------
// Buying flow steps
// ---------------------------------------------------------------------------

export type BuyingStep =
  | "idle"
  | "fetching_utxos"  // fetching buyer UTXOs from mempool
  | "initiating"      // POST /api/orders/buy
  | "signing"         // wallet.signPsbt for buy PSBT
  | "confirming"      // POST /api/orders/confirm
  | "complete"
  | "error";

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface TransactionState {
  // Listing flow
  listingStep: ListingStep;
  listingId: string | null;
  listingError: string | null;

  // Buying flow
  buyingStep: BuyingStep;
  buyingListingId: string | null;
  buyingError: string | null;
  buyTxId: string | null;

  // Listing actions
  setListingStep: (step: ListingStep, listingId?: string) => void;
  setListingError: (error: string) => void;
  resetListing: () => void;

  // Buying actions
  setBuyingStep: (step: BuyingStep) => void;
  startBuying: (listingId: string) => void;
  setBuyingError: (error: string) => void;
  setBuyTxId: (txId: string) => void;
  resetBuying: () => void;
}

export const useTransactionStore = create<TransactionState>()((set) => ({
  // Listing defaults
  listingStep: "idle",
  listingId: null,
  listingError: null,

  // Buying defaults
  buyingStep: "idle",
  buyingListingId: null,
  buyingError: null,
  buyTxId: null,

  // Listing actions
  setListingStep: (step, listingId) =>
    set((state) => ({
      listingStep: step,
      listingId: listingId ?? state.listingId,
      listingError: null,
    })),
  setListingError: (error) => set({ listingStep: "error", listingError: error }),
  resetListing: () =>
    set({ listingStep: "idle", listingId: null, listingError: null }),

  // Buying actions
  setBuyingStep: (step) => set({ buyingStep: step, buyingError: null }),
  startBuying: (listingId) =>
    set({
      buyingStep: "fetching_utxos",
      buyingListingId: listingId,
      buyingError: null,
      buyTxId: null,
    }),
  setBuyingError: (error) => set({ buyingStep: "error", buyingError: error }),
  setBuyTxId: (txId) => set({ buyTxId: txId }),
  resetBuying: () =>
    set({
      buyingStep: "idle",
      buyingListingId: null,
      buyingError: null,
      buyTxId: null,
    }),
}));
