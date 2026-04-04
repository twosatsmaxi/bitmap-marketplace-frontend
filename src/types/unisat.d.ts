/**
 * Type declarations for the UniSat wallet browser extension.
 *
 * The extension injects `window.unisat` when installed.
 * Docs: https://docs.unisat.io/dev/unisat-developer-service/unisat-wallet
 */

interface UniSatWallet {
  /** Prompt the user to authorise the site and return connected accounts. */
  requestAccounts(): Promise<string[]>;

  /** Return already-authorised accounts (no prompt). */
  getAccounts(): Promise<string[]>;

  /** Return the current network, e.g. "livenet" or "testnet". */
  getNetwork(): Promise<string>;

  /** Switch network programmatically. */
  switchNetwork(network: "livenet" | "testnet"): Promise<void>;

  /** Get the current account's public key. */
  getPublicKey(): Promise<string>;

  /** Get the current account's balance in satoshis. */
  getBalance(): Promise<{
    confirmed: number;
    unconfirmed: number;
    total: number;
  }>;

  /**
   * Sign an arbitrary message.
   * @param message - The message string to sign.
   * @param type    - Signature type, e.g. "ecdsa" or "bip322-simple".
   */
  signMessage(message: string, type?: string): Promise<string>;

  /**
   * Sign a PSBT (hex-encoded).
   * @param psbtHex - Hex-encoded PSBT.
   * @param options - Signing options.
   * @returns Hex-encoded signed PSBT.
   */
  signPsbt(
    psbtHex: string,
    options?: {
      autoFinalized?: boolean;
      toSignInputs?: Array<{
        index: number;
        address?: string;
        publickey?: string;
        sighashTypes?: number[];
        disableTweakSigner?: boolean;
      }>;
    },
  ): Promise<string>;

  /** Sign multiple PSBTs in a single call. */
  signPsbts(
    psbtHexs: string[],
    options?: Array<{
      autoFinalized?: boolean;
      toSignInputs?: Array<{
        index: number;
        address?: string;
        publickey?: string;
        sighashTypes?: number[];
        disableTweakSigner?: boolean;
      }>;
    }>,
  ): Promise<string[]>;

  /** Push a raw transaction to the network. */
  pushTx(rawtx: string): Promise<string>;

  /** Subscribe to wallet events. */
  on(event: "accountsChanged" | "networkChanged", handler: (...args: any[]) => void): void;

  /** Unsubscribe from wallet events. */
  removeListener(event: "accountsChanged" | "networkChanged", handler: (...args: any[]) => void): void;
}

interface Window {
  unisat?: UniSatWallet;
}
