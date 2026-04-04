/**
 * Install / remove mock wallet providers on the window object.
 */

export interface MockUnisatWallet {
  getAccounts: ReturnType<typeof vi.fn>;
  requestAccounts: ReturnType<typeof vi.fn>;
  signMessage: ReturnType<typeof vi.fn>;
  signPsbt: ReturnType<typeof vi.fn>;
  getPublicKey: ReturnType<typeof vi.fn>;
}

export function installUnisatMock(
  overrides?: Partial<MockUnisatWallet>
): MockUnisatWallet {
  const mock: MockUnisatWallet = {
    getAccounts: vi.fn().mockResolvedValue(["bc1qord123"]),
    requestAccounts: vi.fn().mockResolvedValue(["bc1qord123"]),
    signMessage: vi.fn().mockResolvedValue("mock-signature"),
    signPsbt: vi.fn().mockResolvedValue("mock-psbt-hex"),
    getPublicKey: vi.fn().mockResolvedValue("mock-pubkey"),
    ...overrides,
  };
  (window as unknown as Record<string, unknown>).unisat = mock;
  return mock;
}

export function removeUnisatMock(): void {
  delete (window as unknown as Record<string, unknown>).unisat;
}

export function installXverseMock(): void {
  (window as unknown as Record<string, unknown>).XverseProviders = {
    BitcoinProvider: {},
  };
}

export function removeXverseMock(): void {
  delete (window as unknown as Record<string, unknown>).XverseProviders;
}
