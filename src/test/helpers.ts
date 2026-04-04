import type { Profile, ChallengeResponse, AuthResponse } from "@/lib/auth-api";

export function createMockProfile(overrides?: Partial<Profile>): Profile {
  return {
    id: "test-profile-1",
    primaryAddress: "bc1qtest123",
    wallets: [
      {
        paymentAddress: "bc1qpay123",
        ordinalsAddress: "bc1qord123",
        label: "unisat",
        linkedAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockChallengeResponse(
  overrides?: Partial<ChallengeResponse>
): ChallengeResponse {
  return {
    message: "Sign this message to connect",
    nonce: "abc123",
    issued_at: new Date().toISOString(),
    expiration_time: new Date(Date.now() + 300_000).toISOString(),
    ...overrides,
  };
}

export function createMockAuthResponse(
  overrides?: Partial<AuthResponse>
): AuthResponse {
  return {
    token: "test-jwt-token",
    profile: createMockProfile(),
    ...overrides,
  };
}

/**
 * Configure global fetch to return sequential responses.
 * Each call to fetch consumes the next response in the array.
 */
export function mockFetchSequence(
  responses: Array<{ status?: number; body?: unknown; headers?: Record<string, string> }>
) {
  const queue = [...responses];
  return vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
    const next = queue.shift() ?? { status: 500, body: { error: "No more mock responses" } };
    const { status = 200, body = {}, headers = {} } = next;
    return new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json", ...headers },
    });
  });
}
