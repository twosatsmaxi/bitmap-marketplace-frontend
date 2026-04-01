"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { connectWallet, disconnectWallet } from "@/lib/wallet-service";
import {
  connectToBackend,
  removeWalletFromProfile,
} from "@/lib/auth-api";
import { useWalletStore } from "@/stores/wallet-store";

export function useWalletConnect() {
  const router = useRouter();
  const { token, profile, setAuth, updateProfile, clearAuth } =
    useWalletStore();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const addresses = await connectWallet();
      const auth = await connectToBackend(addresses);
      setAuth(auth.token, auth.profile);
      router.push("/portfolio");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setIsConnecting(false);
    }
  }, [setAuth, router]);

  const connectAnother = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const addresses = await connectWallet();
      const auth = await connectToBackend(addresses, token ?? undefined);
      setAuth(auth.token, auth.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setIsConnecting(false);
    }
  }, [token, setAuth]);

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
