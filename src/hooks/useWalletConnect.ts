"use client";

import { useState, useCallback } from "react";
import {
  connectWallet,
  disconnectWallet,
  signChallengeMessage,
  type WalletProvider,
} from "@/lib/wallet-service";
import {
  connectToBackend,
  getChallenge,
  removeWalletFromProfile,
  type Profile,
} from "@/lib/auth-api";
import { useWalletStore } from "@/stores/wallet-store";

export function useWalletConnect() {
  const { profile, provider: activeProvider, setAuth, updateProfile, clearAuth } = useWalletStore();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authenticateWallet = useCallback(
    async (provider?: WalletProvider) => {
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
      return connectToBackend(
        addresses,
        signature,
        challenge.message,
        challenge.nonce,
      );
    },
    []
  );

  const connect = useCallback(
    async (provider?: WalletProvider): Promise<Profile | null> => {
      setIsConnecting(true);
      setError(null);
      try {
        const auth = await authenticateWallet(provider);
        setAuth(auth.profile, provider ?? "xverse");
        return auth.profile;
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
    async (provider?: WalletProvider) => {
      setIsConnecting(true);
      setError(null);
      try {
        const auth = await authenticateWallet(provider);
        setAuth(auth.profile, provider ?? "xverse");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Connection failed");
      } finally {
        setIsConnecting(false);
      }
    },
    [authenticateWallet, setAuth]
  );

  const removeWallet = useCallback(
    async (ordinalsAddress: string) => {
      if (!profile) return;
      setError(null);
      try {
        const updatedProfile = await removeWalletFromProfile(ordinalsAddress);
        updateProfile(updatedProfile);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Remove failed");
      }
    },
    [profile, updateProfile]
  );

  const disconnect = useCallback(async () => {
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
    disconnect,
    isConnecting,
    error,
  };
}
