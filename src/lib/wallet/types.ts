/** Wallet addresses returned after a successful connection. */
export interface WalletAddresses {
  paymentAddress: string;
  ordinalsAddress: string;
}

/** Identifier for each supported wallet extension. */
export type WalletProviderKey = "xverse" | "unisat";

/** Metadata surfaced in the wallet-selection UI. */
export interface DetectedWallet {
  provider: WalletProviderKey;
  name: string;
  installed: boolean;
}

/**
 * Strategy interface that every wallet extension must implement.
 *
 * Each method mirrors a user-facing wallet action so the rest of the
 * application never has to branch on the concrete provider.
 */
export interface WalletProviderStrategy {
  /** Unique key used for persistence and routing. */
  readonly key: WalletProviderKey;
  /** Human-readable name shown in the UI. */
  readonly name: string;

  /** Returns `true` when the browser extension is detected. */
  isAvailable(): boolean;

  /** Prompt the user to connect and return their addresses. */
  connect(): Promise<WalletAddresses>;

  /** Gracefully disconnect (no-op when the extension lacks an API for this). */
  disconnect(): Promise<void>;

  /** Sign an arbitrary message (BIP-322). */
  signMessage(address: string, message: string): Promise<string>;

  /**
   * Sign specific inputs of a PSBT.
   * @param psbtBase64 - The PSBT encoded as base64.
   * @param address    - The signer address (used by Xverse to map inputs).
   * @param inputIndices - Which inputs to sign.
   * @returns The partially-signed PSBT as base64.
   */
  signPsbt(
    psbtBase64: string,
    address: string,
    inputIndices: number[],
  ): Promise<string>;
}
