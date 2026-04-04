/**
 * Public surface for wallet interactions.
 *
 * Re-exports the shared types plus the thin facade functions that the rest
 * of the app already imports from `@/lib/wallet-service`.  The concrete
 * provider classes live in their own files but consumers never import them
 * directly -- they go through `getProvider` / the facade functions here.
 */

export type {
  WalletAddresses,
  WalletProviderKey,
  DetectedWallet,
  WalletProviderStrategy,
} from "./types";

export { getProvider, detectWallets } from "./registry";
export { XverseProvider } from "./xverse-provider";
export { UnisatProvider } from "./unisat-provider";
