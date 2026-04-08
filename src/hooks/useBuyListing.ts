"use client";

import { useCallback } from "react";
import { useTransactionStore } from "@/stores/transaction-store";
import { useWalletStore } from "@/stores/wallet-store";
import {
  fetchUtxos,
  fetchTxHex,
  initiateBuy,
  confirmOrder,
} from "@/lib/marketplace-api";
import { signPsbtInputs } from "@/lib/wallet-service";
import type { SpendableInputPayload } from "@/lib/marketplace-types";
import { useToast } from "./useToast";

export function useBuyListing() {
  const {
    buyingStep,
    buyingListingId,
    buyingError,
    buyTxId,
    startBuying,
    setBuyingStep,
    setBuyingError,
    setBuyTxId,
    resetBuying,
  } = useTransactionStore();
  const profile = useWalletStore((s) => s.profile);
  const provider = useWalletStore((s) => s.provider);
  const { toast } = useToast();

  const buy = useCallback(
    async (listingId: string, feeRateSatVb?: number) => {
      const paymentAddress = profile?.wallets[0]?.paymentAddress;
      if (!paymentAddress) {
        setBuyingError("Connect wallet first");
        return;
      }

      try {
        // Step 1: Fetch buyer's UTXOs
        startBuying(listingId);
        const utxos = await fetchUtxos(paymentAddress);

        if (utxos.length === 0) {
          throw new Error("No confirmed UTXOs found. Insufficient balance.");
        }

        // Sort by value descending and pick the largest confirmed UTXO
        const sorted = [...utxos].sort((a, b) => b.value - a.value);
        const fundingUtxo = sorted[0];

        // Fetch raw tx for non_witness_utxo
        const nonWitnessUtxoHex = await fetchTxHex(fundingUtxo.txid);

        // We need the script_pubkey for the witness_utxo. For P2WPKH, we can
        // derive it from the address, but it's simpler to extract from the raw tx.
        // For now, we'll parse the raw tx to get the output script.
        // The backend will validate everything.
        const fundingInput: SpendableInputPayload = {
          txid: fundingUtxo.txid,
          vout: fundingUtxo.vout,
          value_sats: fundingUtxo.value,
          witness_utxo: {
            // Script pubkey will be derived from the non_witness_utxo by the backend
            // For now, provide a placeholder — the backend extracts it from non_witness_utxo
            script_pubkey_hex: "",
            value_sats: fundingUtxo.value,
          },
          non_witness_utxo_hex: nonWitnessUtxoHex,
        };

        // Step 2: Initiate buy — backend returns unsigned PSBT
        setBuyingStep("initiating");
        const buyResult = await initiateBuy({
          listing_id: listingId,
          buyer_address: paymentAddress,
          buyer_funding_input: fundingInput,
          fee_rate_sat_vb: feeRateSatVb,
        });

        // Step 3: Sign the buy PSBT
        setBuyingStep("signing");
        const signedPsbt = await signPsbtInputs(
          buyResult.psbt,
          paymentAddress,
          [1], // buyer signs input 1 (funding input)
          provider ?? undefined,
        );

        // Step 4: Confirm order — backend co-signs and broadcasts
        setBuyingStep("confirming");
        const confirmation = await confirmOrder({
          listing_id: listingId,
          signed_psbt: signedPsbt,
          locking_txid: buyResult.locking_txid,
          buyer_address: paymentAddress,
        });

        const txId =
          confirmation.sale_tx_id ?? confirmation.tx_id ?? "unknown";
        setBuyTxId(txId);
        setBuyingStep("complete");
        toast({ title: "Purchase complete!", variant: "success" });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Purchase failed";

        if (message === "USER_REJECTED") {
          setBuyingError("Transaction cancelled by user");
          toast({ title: "Transaction cancelled", variant: "default" });
        } else {
          setBuyingError(message);
          toast({ title: message, variant: "error" });
        }
      }
    },
    [
      profile,
      provider,
      startBuying,
      setBuyingStep,
      setBuyingError,
      setBuyTxId,
      toast,
    ],
  );

  return {
    buy,
    step: buyingStep,
    listingId: buyingListingId,
    error: buyingError,
    txId: buyTxId,
    isProcessing:
      buyingStep !== "idle" &&
      buyingStep !== "complete" &&
      buyingStep !== "error",
    reset: resetBuying,
  };
}
