import type { WalletAddresses } from "./wallet-service";

export interface ProfileWallet {
  paymentAddress: string;
  ordinalsAddress: string;
  label: string;
  linkedAt: string;
}

export interface Profile {
  id: string;
  primaryAddress: string;
  wallets: ProfileWallet[];
  createdAt: string;
}

export interface AuthResponse {
  profile: Profile;
  token: string;
}

const API_BASE = "/api/auth";

export async function connectToBackend(
  addresses: WalletAddresses,
  existingToken?: string
): Promise<AuthResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (existingToken) {
    headers["Authorization"] = `Bearer ${existingToken}`;
  }

  const res = await fetch(`${API_BASE}/connect`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      paymentAddress: addresses.paymentAddress,
      ordinalsAddress: addresses.ordinalsAddress,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `Auth connect failed: ${res.status}`);
  }

  return res.json() as Promise<AuthResponse>;
}

export async function getProfile(token: string): Promise<Profile> {
  const res = await fetch(`${API_BASE}/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch profile: ${res.status}`);
  }

  return res.json() as Promise<Profile>;
}

export async function removeWalletFromProfile(
  token: string,
  ordinalsAddress: string
): Promise<Profile> {
  const res = await fetch(
    `${API_BASE}/wallets/${encodeURIComponent(ordinalsAddress)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `Failed to remove wallet: ${res.status}`);
  }

  return res.json() as Promise<Profile>;
}
