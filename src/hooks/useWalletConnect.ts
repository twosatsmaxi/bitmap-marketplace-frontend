"use client";

import { useState, useCallback, useEffect } from "react";
import { mutate as swrMutate } from "swr";
import {
  connectWallet,
  disconnectWallet,
  signChallengeMessage,
  type WalletProvider,
} from "@/lib/wallet-service";
import {
  connectToBackend,
  getChallenge,
  logout as logoutApi,
  removeWalletFromProfile,
  updateWalletLabel as updateWalletLabelApi,
  type Profile,
} from "@/lib/auth-api";
import { useWalletStore } from "@/stores/wallet-store";

/** Revalidate all SWR-cached portfolio entries so counts refresh immediately. */
function invalidatePortfolioCache() {
  swrMutate(
    (key: unknown) => typeof key === "string" && key.startsWith("/api/portfolio/"),
    undefined,
    { revalidate: true },
  );
}

export function useWalletConnect() {
  const { profile, provider: activeProvider, token, setAuth, updateProfile, clearAuth } = useWalletStore();
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const unsub = useWalletStore.persist.onFinishHydration(() => setHasHydrated(true));
    if (useWalletStore.persist.getOptions().skipHydration !== true) {
      setHasHydrated(useWalletStore.persist.hasHydrated());
    }
    return unsub;
  }, []);
  const [error, setError] = useState<string | null>(null);

  const authenticateWallet = useCallback(
    async (provider?: WalletProvider, authToken?: string) => {
      const addresses = await connectWallet(provider);
      const challenge = await getChallenge(addresses.ordinalsAddress);
      if (new Date(challenge.expiration_time) <= new Date()) {
        throw new Error("Challenge expired, please try again");
      }
      const signature = await signChallengeMessage(
        addresses.ordinalsAddress,
        challenge.message,
        provider
      );
      const auth = await connectToBackend(
        addresses,
        signature,
        challenge.message,
        challenge.nonce,
        provider,
        authToken,
      );
      return { ...auth, ordinalsAddress: addresses.ordinalsAddress };
    },
    []
  );

  const connect = useCallback(
    async (provider?: WalletProvider): Promise<{ profile: Profile; ordinalsAddress: string } | null> => {
      setIsConnecting(true);
      setError(null);
      try {
        const auth = await authenticateWallet(provider);
        setAuth(auth.profile, provider ?? "xverse", auth.token);
        invalidatePortfolioCache();
        return { profile: auth.profile, ordinalsAddress: auth.ordinalsAddress };
      } catch (err) {
        setError(err instanceof Error ? err.message : "Connection failed");
        return null;
      } finally {
        setIsConnecting(false);
      }
    },
    [authenticateWallet, setAuth]
  );

  const connectAnother = useCallback(
    async (provider?: WalletProvider): Promise<{ profile: Profile; ordinalsAddress: string } | null> => {
      setIsConnecting(true);
      setError(null);
      try {
        // Check if wallet is already connected before attempting full auth flow
        const addresses = await connectWallet(provider);
        const existing = profile?.wallets.find(
          (w) =>
            w.ordinalsAddress === addresses.ordinalsAddress ||
            w.paymentAddress === addresses.paymentAddress
        );
        if (existing) {
          const short = `${existing.ordinalsAddress.slice(0, 6)}...${existing.ordinalsAddress.slice(-4)}`;
          setError(`Wallet ${short} (${existing.label}) is already linked to your profile`);
          return null;
        }

        const auth = await authenticateWallet(provider, token ?? undefined);
        setAuth(auth.profile, provider ?? "xverse", auth.token);
        invalidatePortfolioCache();
        return { profile: auth.profile, ordinalsAddress: auth.ordinalsAddress };
      } catch (err) {
        setError(err instanceof Error ? err.message : "Connection failed");
        return null;
      } finally {
        setIsConnecting(false);
      }
    },
    [authenticateWallet, setAuth, token, profile]
  );

  const removeWallet = useCallback(
    async (ordinalsAddress: string) => {
      if (!profile) return;
      setError(null);
      try {
        const updatedProfile = await removeWalletFromProfile(ordinalsAddress);
        updateProfile(updatedProfile);
        invalidatePortfolioCache();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Remove failed");
      }
    },
    [profile, updateProfile]
  );

  const updateWalletLabel = useCallback(
    async (ordinalsAddress: string, label: string) => {
      if (!profile) return;
      setError(null);
      try {
        const updatedProfile = await updateWalletLabelApi(ordinalsAddress, label);
        updateProfile(updatedProfile);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Label update failed");
      }
    },
    [profile, updateProfile]
  );

  const disconnect = useCallback(async () => {
    await logoutApi();
    await disconnectWallet(activeProvider ?? undefined);
    clearAuth();
  }, [activeProvider, clearAuth]);

  return {
    profile,
    provider: activeProvider,
    wallets: profile?.wallets ?? [],
    isConnected: !!profile,
    connect,
    connectAnother,
    removeWallet,
    updateWalletLabel,
    disconnect,
    isConnecting,
    error,
    hasHydrated,
  };
}
