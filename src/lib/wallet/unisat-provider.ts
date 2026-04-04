import type { WalletAddresses, WalletProviderStrategy } from "./types";

/** Safely access the injected UniSat global (typed via `src/types/unisat.d.ts`). */
function getUnisat(): UniSatWallet | undefined {
  if (typeof window === "undefined") return undefined;
  return window.unisat;
}

export class UnisatProvider implements WalletProviderStrategy {
  readonly key = "unisat" as const;
  readonly name = "Unisat";

  isAvailable(): boolean {
    return !!getUnisat();
  }

  async connect(): Promise<WalletAddresses> {
    const unisat = getUnisat();
    if (!unisat) throw new Error("Unisat wallet not found");

    const accounts = await unisat.requestAccounts();
    if (!accounts.length) throw new Error("No accounts returned from Unisat");

    // UniSat uses a single address for both payment and ordinals
    return {
      paymentAddress: accounts[0],
      ordinalsAddress: accounts[0],
    };
  }

  async disconnect(): Promise<void> {
    // UniSat has no explicit disconnect API; clearing local state is sufficient
  }

  async signMessage(_address: string, message: string): Promise<string> {
    const unisat = getUnisat();
    if (!unisat) throw new Error("Unisat wallet not found");

    return unisat.signMessage(message, "bip322-simple");
  }

  async signPsbt(
    psbtBase64: string,
    _address: string,
    inputIndices: number[],
  ): Promise<string> {
    const unisat = getUnisat();
    if (!unisat) throw new Error("Unisat wallet not found");

    // UniSat expects hex, not base64
    const psbtHex = Buffer.from(psbtBase64, "base64").toString("hex");

    const signedHex = await unisat.signPsbt(psbtHex, {
      autoFinalized: false,
      toSignInputs: inputIndices.map((index) => ({
        index,
        disableTweakSigner: true,
      })),
    });

    // Convert back to base64 for consistency
    return Buffer.from(signedHex, "hex").toString("base64");
  }
}
