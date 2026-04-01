"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { connectWallet, disconnectWallet, signChallengeMessage } from "@/lib/wallet-service";
import {
  connectToBackend,
  getChallenge,
  removeWalletFromProfile,
} from "@/lib/auth-api";
import { useWalletStore } from "@/stores/wallet-store";

export function useWalletConnect() {
  const router = useRouter();
  const { token, profile, setAuth, updateProfile, clearAuth } =
    useWalletStore();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authenticateWallet = useCallback(
    async (existingToken?: string) => {
      const addresses = await connectWallet();
      const challenge = await getChallenge(addresses.ordinalsAddress);
      const signature = await signChallengeMessage(
        addresses.ordinalsAddress,
        challenge.message
      );
      return connectToBackend(
        addresses,
        signature,
        challenge.message,
        challenge.nonce,
        existingToken
      );
    },
    []
  );

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const auth = await authenticateWallet();
      setAuth(auth.token, auth.profile);
      router.push("/portfolio");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setIsConnecting(false);
    }
  }, [authenticateWallet, setAuth, router]);

  const connectAnother = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const auth = await authenticateWallet(token ?? undefined);
      setAuth(auth.token, auth.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setIsConnecting(false);
    }
  }, [authenticateWallet, token, setAuth]);

  const removeWallet = useCallback(
    async (ordinalsAddress: string) => {
      if (!token) return;
      setError(null);
      try {
        const updatedProfile = await removeWalletFromProfile(
          token,
          ordinalsAddress
        );
        updateProfile(updatedProfile);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Remove failed");
      }
    },
    [token, updateProfile]
  );

  const disconnect = useCallback(async () => {
    await disconnectWallet();
    clearAuth();
  }, [clearAuth]);

  return {
    profile,
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
