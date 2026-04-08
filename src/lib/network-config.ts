/**
 * Centralized Bitcoin network configuration.
 *
 * Reads `NEXT_PUBLIC_BITCOIN_NETWORK` once at module load and derives all
 * network-dependent URLs from it.  A single env var change switches the
 * entire frontend between mainnet and signet (or testnet4).
 */

export type BitcoinNetwork = "mainnet" | "signet" | "testnet4";

export const BITCOIN_NETWORK: BitcoinNetwork = (() => {
  const raw = process.env.NEXT_PUBLIC_BITCOIN_NETWORK ?? "mainnet";
  if (raw === "mainnet" || raw === "signet" || raw === "testnet4") return raw;
  return "mainnet";
})();

export function isMainnet(): boolean {
  return BITCOIN_NETWORK === "mainnet";
}

export function getNetworkLabel(): string {
  switch (BITCOIN_NETWORK) {
    case "signet":
      return "Signet";
    case "testnet4":
      return "Testnet4";
    default:
      return "Mainnet";
  }
}

// ---------------------------------------------------------------------------
// BestInSlot API
// ---------------------------------------------------------------------------

export function getBisApiBase(): string {
  switch (BITCOIN_NETWORK) {
    case "signet":
      return "https://signet_api.bestinslot.xyz/v3";
    case "testnet4":
      return "https://testnet.api.bestinslot.xyz/v3";
    default:
      return "https://api.bestinslot.xyz/v3";
  }
}

// ---------------------------------------------------------------------------
// Mempool.space API
// ---------------------------------------------------------------------------

function getMempoolBase(): string {
  switch (BITCOIN_NETWORK) {
    case "signet":
      return "https://mempool.space/signet";
    case "testnet4":
      return "https://mempool.space/testnet4";
    default:
      return "https://mempool.space";
  }
}

export function getMempoolApiBase(): string {
  return `${getMempoolBase()}/api`;
}

/** Full explorer URL for a transaction. */
export function getMempoolTxUrl(txid: string): string {
  return `${getMempoolBase()}/tx/${txid}`;
}

/** Full explorer URL for an address. */
export function getMempoolAddressUrl(address: string): string {
  return `${getMempoolBase()}/address/${address}`;
}

// ---------------------------------------------------------------------------
// CSP domains (for middleware)
// ---------------------------------------------------------------------------

/** Returns the connect-src domains needed for the current network. */
export function getCspConnectDomains(): string[] {
  switch (BITCOIN_NETWORK) {
    case "signet":
      return [
        "signet_api.bestinslot.xyz",
        "api.bestinslot.xyz",
        "mempool.space",
      ];
    case "testnet4":
      return [
        "testnet.api.bestinslot.xyz",
        "api.bestinslot.xyz",
        "mempool.space",
      ];
    default:
      return ["api.bestinslot.xyz", "mempool.space"];
  }
}

/** Returns the img-src domains needed for the current network. */
export function getCspImgDomains(): string[] {
  return ["ord.bestinslot.xyz"];
}
