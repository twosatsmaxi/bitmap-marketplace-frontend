"use client";

import { useCallback } from "react";
import { useTransactionStore } from "@/stores/transaction-store";
import { useWalletStore } from "@/stores/wallet-store";
import {
  prepareListing,
  createListing,
  submitLocking,
  fetchTxHex,
} from "@/lib/marketplace-api";
import { signPsbtInputs } from "@/lib/wallet-service";
import type { SpendableInputPayload } from "@/lib/marketplace-types";
import { useToast } from "./useToast";

interface CreateListingParams {
  inscriptionId: string;
  priceSats: number;
  sellerPubkey: string;
  /** Optional gas funding UTXO — if not provided, the backend handles it. */
  gasFundingInput?: SpendableInputPayload;
}

export function useCreateListing() {
  const { listingStep, listingId, listingError, setListingStep, setListingError, resetListing } =
    useTransactionStore();
  const provider = useWalletStore((s) => s.provider);
  const { toast } = useToast();

  const create = useCallback(
    async (params: CreateListingParams) => {
      const { inscriptionId, priceSats, sellerPubkey, gasFundingInput } = params;

      try {
        // Step 1: Prepare — look up inscription UTXO
        setListingStep("preparing");
        const prepared = await prepareListing(inscriptionId);

        // Fetch the raw tx hex for non_witness_utxo
        const nonWitnessUtxoHex = await fetchTxHex(prepared.txid);

        const inscriptionInput: SpendableInputPayload = {
          txid: prepared.txid,
          vout: prepared.vout,
          value_sats: prepared.value_sats,
          witness_utxo: {
            script_pubkey_hex: prepared.script_pubkey_hex,
            value_sats: prepared.value_sats,
          },
          non_witness_utxo_hex: nonWitnessUtxoHex,
        };

        // Step 2: Create listing — backend builds locking + sale template PSBTs
        setListingStep("creating");
        const listing = await createListing({
          inscription_id: inscriptionId,
          price_sats: priceSats,
          seller_address: prepared.owner_address ?? "",
          seller_pubkey: sellerPubkey,
          inscription_input: inscriptionInput,
          gas_funding_input: gasFundingInput,
        });

        if (!listing.locking_psbt || !listing.sale_template_psbt) {
          throw new Error("Backend did not return locking/sale PSBTs");
        }

        const listingIdValue = listing.id;
        setListingStep("signing_locking", listingIdValue);

        // Step 3: Sign the locking PSBT
        const signedLockingPsbt = await signPsbtInputs(
          listing.locking_psbt,
          prepared.owner_address ?? "",
          [0], // seller signs input 0 (inscription input)
          provider ?? undefined,
        );

        // Step 4: Sign the sale template PSBT (SIGHASH_SINGLE|ANYONECANPAY)
        setListingStep("signing_sale");
        const signedSaleTemplatePsbt = await signPsbtInputs(
          listing.sale_template_psbt,
          prepared.owner_address ?? "",
          [0], // seller signs the multisig input
          provider ?? undefined,
        );

        // Step 5: Submit both signed PSBTs
        setListingStep("submitting");
        await submitLocking(listingIdValue, {
          signed_locking_psbt: signedLockingPsbt,
          signed_sale_template_psbt: signedSaleTemplatePsbt,
        });

        setListingStep("complete", listingIdValue);
        toast({ title: "Listing created successfully!", variant: "success" });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Listing failed";

        if (message === "USER_REJECTED") {
          setListingError("Transaction cancelled by user");
          toast({ title: "Transaction cancelled", variant: "default" });
        } else {
          setListingError(message);
          toast({ title: message, variant: "error" });
        }
      }
    },
    [setListingStep, setListingError, provider, toast],
  );

  return {
    createListing: create,
    step: listingStep,
    listingId,
    error: listingError,
    isProcessing: listingStep !== "idle" && listingStep !== "complete" && listingStep !== "error",
    reset: resetListing,
  };
}
