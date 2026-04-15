import type { Giveaway, GiveawayEntry, GiveawayWithCount } from "./types";

const API_BASE = "/api/giveaways";

function extractErrorMessage(body: string, fallback: string): string {
  try {
    const parsed = JSON.parse(body);
    if (parsed.error) return parsed.error;
  } catch { /* not JSON */ }
  return body || fallback;
}

// ---------------------------------------------------------------------------
// Public (no auth)
// ---------------------------------------------------------------------------

export async function listGiveaways(
  limit = 20,
  offset = 0
): Promise<{ giveaways: GiveawayWithCount[] }> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  const res = await fetch(`${API_BASE}?${params}`, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(extractErrorMessage(body, `List giveaways failed: ${res.status}`));
  }
  return res.json();
}

export async function getGiveaway(
  id: string
): Promise<{ giveaway: Giveaway; entry_count: number }> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(extractErrorMessage(body, `Get giveaway failed: ${res.status}`));
  }
  return res.json();
}

export async function enterGiveaway(
  id: string,
  walletAddress: string
): Promise<GiveawayEntry> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}/enter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet_address: walletAddress }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(extractErrorMessage(body, `Enter giveaway failed: ${res.status}`));
  }
  return res.json();
}

export async function getClaimableGiveaways(
  address: string
): Promise<{ giveaways: Giveaway[] }> {
  const params = new URLSearchParams({ address });
  const res = await fetch(`${API_BASE}/claims?${params}`, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(extractErrorMessage(body, `Get claims failed: ${res.status}`));
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Authenticated
// ---------------------------------------------------------------------------

export async function createGiveaway(data: {
  inscription_id: string;
  price_sats: number;
  title: string;
  description?: string;
  criteria?: string;
  deadline?: string;
}): Promise<Giveaway> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(extractErrorMessage(body, `Create giveaway failed: ${res.status}`));
  }
  return res.json();
}

export async function getMyGiveaways(): Promise<{ giveaways: Giveaway[] }> {
  const res = await fetch(`${API_BASE}/my`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(extractErrorMessage(body, `Get my giveaways failed: ${res.status}`));
  }
  return res.json();
}

export async function listEntries(
  giveawayId: string
): Promise<{ entries: GiveawayEntry[] }> {
  const res = await fetch(
    `${API_BASE}/${encodeURIComponent(giveawayId)}/entries`,
    { credentials: "include", cache: "no-store" }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(extractErrorMessage(body, `List entries failed: ${res.status}`));
  }
  return res.json();
}

export async function selectWinner(
  giveawayId: string,
  winnerAddress: string
): Promise<{ giveaway_id: string; winner_address: string; listing_id: string }> {
  const res = await fetch(
    `${API_BASE}/${encodeURIComponent(giveawayId)}/select-winner`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ winner_address: winnerAddress }),
    }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(extractErrorMessage(body, `Select winner failed: ${res.status}`));
  }
  return res.json();
}

export async function cancelGiveaway(giveawayId: string): Promise<void> {
  const res = await fetch(
    `${API_BASE}/${encodeURIComponent(giveawayId)}/cancel`,
    {
      method: "POST",
      credentials: "include",
    }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(extractErrorMessage(body, `Cancel giveaway failed: ${res.status}`));
  }
}
