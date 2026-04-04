import { AddressPurpose } from "sats-connect";
import type { WalletAddresses, WalletProviderStrategy } from "./types";

/** Get the raw Xverse BitcoinProvider (bypasses sats-connect modal). */
function getNativeProvider(): any {
  const w = window as unknown as Record<string, any>;
  return w.XverseProviders?.BitcoinProvider ?? w.BitcoinProvider;
}

export class XverseProvider implements WalletProviderStrategy {
  readonly key = "xverse" as const;
  readonly name = "Xverse";

  isAvailable(): boolean {
    if (typeof window === "undefined") return false;
    const w = window as unknown as Record<string, unknown>;
    return !!(w.XverseProviders || w.BitcoinProvider);
  }

  async connect(): Promise<WalletAddresses> {
    const provider = getNativeProvider();
    if (!provider) throw new Error("Xverse wallet not found");

    const res = await provider.request("getAccounts", {
      purposes: [AddressPurpose.Payment, AddressPurpose.Ordinals],
    });

    if (res.error) {
      if (res.error?.code === 4001) throw new Error("USER_REJECTED");
      throw new Error(res.error?.message || "Wallet connection failed");
    }

    const results = res.result ?? [];
    const payment = results.find(
      (a: any) => a.purpose === AddressPurpose.Payment,
    );
    const ordinals = results.find(
      (a: any) => a.purpose === AddressPurpose.Ordinals,
    );

    if (!payment?.address || !ordinals?.address) {
      throw new Error("Wallet did not return required addresses");
    }

    return {
      paymentAddress: payment.address,
      ordinalsAddress: ordinals.address,
    };
  }

  async disconnect(): Promise<void> {
    try {
      const provider = getNativeProvider();
      if (provider) {
        await provider.request("wallet_renouncePermissions", undefined);
      }
    } catch {
      // ignore errors on disconnect
    }
  }

  async signMessage(address: string, message: string): Promise<string> {
    const provider = getNativeProvider();
    if (!provider) throw new Error("Xverse wallet not found");

    const res = await provider.request("signMessage", {
      address,
      message,
      protocol: "BIP322",
    });

    if (res.error) {
      if (res.error?.code === 4001) throw new Error("USER_REJECTED");
      throw new Error(res.error?.message || "Message signing failed");
    }

    return res.result?.signature ?? res.signature;
  }

  async signPsbt(
    psbtBase64: string,
    address: string,
    inputIndices: number[],
  ): Promise<string> {
    const provider = getNativeProvider();
    if (!provider) throw new Error("Xverse wallet not found");

    const res = await provider.request("signPsbt", {
      psbt: psbtBase64,
      signInputs: { [address]: inputIndices },
      broadcast: false,
    });

    if (res.error) {
      if (res.error?.code === 4001) throw new Error("USER_REJECTED");
      throw new Error(res.error?.message || "signPsbt failed");
    }

    return res.result?.psbt ?? res.psbt;
  }
}
