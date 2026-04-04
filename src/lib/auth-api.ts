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
  token: string;
  profile: Profile;
}

const API_BASE = "/api/auth";

function extractErrorMessage(body: string, fallback: string): string {
  try {
    const parsed = JSON.parse(body);
    if (parsed.error) return parsed.error;
  } catch { /* not JSON */ }
  return body || fallback;
}

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
    throw new Error(extractErrorMessage(body, `Challenge failed: ${res.status}`));
  }
  return res.json() as Promise<ChallengeResponse>;
}

export async function connectToBackend(
  addresses: WalletAddresses,
  signature: string,
  message: string,
  nonce: string,
  provider?: string,
  authToken?: string,
): Promise<AuthResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }
  const res = await fetch(`${API_BASE}/connect`, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify({
      paymentAddress: addresses.paymentAddress,
      ordinalsAddress: addresses.ordinalsAddress,
      signature,
      message,
      nonce,
      label: provider,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(extractErrorMessage(body, `Auth connect failed: ${res.status}`));
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

export async function updateWalletLabel(
  ordinalsAddress: string,
  label: string
): Promise<Profile> {
  const res = await fetch(
    `${API_BASE}/wallets/${encodeURIComponent(ordinalsAddress)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ label }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(extractErrorMessage(body, `Failed to update label: ${res.status}`));
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
    throw new Error(extractErrorMessage(body, `Failed to remove wallet: ${res.status}`));
  }

  return res.json() as Promise<Profile>;
}
