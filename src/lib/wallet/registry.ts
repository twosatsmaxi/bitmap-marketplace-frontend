import type {
  DetectedWallet,
  WalletProviderKey,
  WalletProviderStrategy,
} from "./types";
import { XverseProvider } from "./xverse-provider";
import { UnisatProvider } from "./unisat-provider";

/** All registered provider instances, ordered as they appear in the UI. */
const PROVIDERS: WalletProviderStrategy[] = [
  new XverseProvider(),
  new UnisatProvider(),
];

/** Look up a concrete provider by key, defaulting to Xverse. */
export function getProvider(
  key?: WalletProviderKey,
): WalletProviderStrategy {
  if (key) {
    const found = PROVIDERS.find((p) => p.key === key);
    if (found) return found;
  }
  return PROVIDERS[0]; // default: xverse
}

/** Enumerate all known providers with their install status. */
export function detectWallets(): DetectedWallet[] {
  return PROVIDERS.map((p) => ({
    provider: p.key,
    name: p.name,
    installed: p.isAvailable(),
  }));
}
