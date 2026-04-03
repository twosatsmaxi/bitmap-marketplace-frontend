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
}

const API_BASE = "/api/auth";

export interface ChallengeResponse {
  message: string;
  nonce: string;
  issued_at: string;
  expiration_time: string;
}

export async function getChallenge(address: string): Promise<ChallengeResponse> {
  const res = await fetch(
    `${API_BASE}/challenge?address=${encodeURIComponent(address)}`
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `Challenge failed: ${res.status}`);
  }
  return res.json() as Promise<ChallengeResponse>;
}

export async function connectToBackend(
  addresses: WalletAddresses,
  signature: string,
  message: string,
  nonce: string,
  provider?: string,
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/connect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      paymentAddress: addresses.paymentAddress,
      ordinalsAddress: addresses.ordinalsAddress,
      signature,
      message,
      nonce,
      provider,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `Auth connect failed: ${res.status}`);
  }

  return res.json() as Promise<AuthResponse>;
}

export async function getProfile(): Promise<Profile> {
  const res = await fetch(`${API_BASE}/profile`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch profile: ${res.status}`);
  }

  return res.json() as Promise<Profile>;
}

export async function removeWalletFromProfile(
  ordinalsAddress: string
): Promise<Profile> {
  const res = await fetch(
    `${API_BASE}/wallets/${encodeURIComponent(ordinalsAddress)}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `Failed to remove wallet: ${res.status}`);
  }

  return res.json() as Promise<Profile>;
}
