/**
 * Thin facade that the rest of the app imports for wallet operations.
 *
 * Internally delegates to concrete WalletProviderStrategy implementations
 * via the provider registry.  This keeps the public API stable while the
 * provider-specific logic lives in `./wallet/`.
 */

import { getProvider, detectWallets } from "./wallet/registry";
import type {
  WalletAddresses,
  WalletProviderKey,
  DetectedWallet,
} from "./wallet/types";

/* ── Re-exports (keep existing import paths working) ─────── */

export type { WalletAddresses, DetectedWallet };

/**
 * Alias kept for backwards-compat: existing code imports `WalletProvider`
 * from this module.  Prefer `WalletProviderKey` in new code.
 */
export type WalletProvider = WalletProviderKey;

export { detectWallets };

export function isWalletAvailable(): boolean {
  return detectWallets().some((w) => w.installed);
}

/* ── Facade functions ────────────────────────────────────── */

export async function connectWallet(
  provider?: WalletProvider,
): Promise<WalletAddresses> {
  return getProvider(provider).connect();
}

export async function disconnectWallet(
  walletProvider?: WalletProvider,
): Promise<void> {
  return getProvider(walletProvider).disconnect();
}

export async function signChallengeMessage(
  address: string,
  message: string,
  walletProvider?: WalletProvider,
): Promise<string> {
  return getProvider(walletProvider).signMessage(address, message);
}

export async function signPsbtInputs(
  psbtBase64: string,
  address: string,
  inputIndices: number[],
  walletProvider?: WalletProvider,
): Promise<string> {
  return getProvider(walletProvider).signPsbt(psbtBase64, address, inputIndices);
}

export async function signPsbt(
  psbtBase64: string,
  paymentAddress: string,
  walletProvider?: WalletProvider,
): Promise<string> {
  return signPsbtInputs(psbtBase64, paymentAddress, [0], walletProvider);
}
