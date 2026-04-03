import { AddressPurpose } from "sats-connect";

export interface WalletAddresses {
  paymentAddress: string;
  ordinalsAddress: string;
}

export type WalletProvider = "xverse" | "unisat";

export interface DetectedWallet {
  provider: WalletProvider;
  name: string;
  installed: boolean;
}

/** Get the raw Xverse BitcoinProvider (bypasses sats-connect modal) */
function getXverseProvider(): any {
  const w = window as unknown as Record<string, any>;
  return w.XverseProviders?.BitcoinProvider ?? w.BitcoinProvider;
}

export function detectWallets(): DetectedWallet[] {
  if (typeof window === "undefined") {
    return [
      { provider: "xverse", name: "Xverse", installed: false },
      { provider: "unisat", name: "Unisat", installed: false },
    ];
  }
  const w = window as unknown as Record<string, unknown>;
  return [
    {
      provider: "xverse",
      name: "Xverse",
      installed: !!(w.XverseProviders || w.BitcoinProvider),
    },
    {
      provider: "unisat",
      name: "Unisat",
      installed: !!w.unisat,
    },
  ];
}

export function isWalletAvailable(): boolean {
  return detectWallets().some((w) => w.installed);
}

async function connectXverse(): Promise<WalletAddresses> {
  const provider = getXverseProvider();
  if (!provider) throw new Error("Xverse wallet not found");

  const res = await provider.request("getAccounts", {
    purposes: [AddressPurpose.Payment, AddressPurpose.Ordinals],
  });

  if (res.status !== "success") {
    if (res.error?.code === 4001) throw new Error("USER_REJECTED");
    throw new Error("Wallet connection failed");
  }

  const payment = res.result.find(
    (a: any) => a.purpose === AddressPurpose.Payment
  );
  const ordinals = res.result.find(
    (a: any) => a.purpose === AddressPurpose.Ordinals
  );

  if (!payment?.address || !ordinals?.address) {
    throw new Error("Wallet did not return required addresses");
  }

  return {
    paymentAddress: payment.address,
    ordinalsAddress: ordinals.address,
  };
}

async function connectUnisat(): Promise<WalletAddresses> {
  const w = window as unknown as Record<string, any>;
  const unisat = w.unisat;
  if (!unisat) throw new Error("Unisat wallet not found");

  const accounts: string[] = await unisat.requestAccounts();
  if (!accounts.length) throw new Error("No accounts returned from Unisat");

  // Unisat uses a single address for both payment and ordinals
  return {
    paymentAddress: accounts[0],
    ordinalsAddress: accounts[0],
  };
}

export async function connectWallet(
  provider?: WalletProvider
): Promise<WalletAddresses> {
  if (provider === "unisat") return connectUnisat();
  return connectXverse();
}

export async function disconnectWallet(): Promise<void> {
  try {
    const provider = getXverseProvider();
    if (provider) {
      await provider.request("wallet_renouncePermissions", undefined);
    }
  } catch {
    // ignore errors on disconnect
  }
}

export async function signChallengeMessage(
  address: string,
  message: string,
  walletProvider?: WalletProvider
): Promise<string> {
  if (walletProvider === "unisat") {
    const w = window as unknown as Record<string, any>;
    const unisat = w.unisat;
    if (!unisat) throw new Error("Unisat wallet not found");
    return unisat.signMessage(message, "bip322-simple");
  }

  const provider = getXverseProvider();
  if (!provider) throw new Error("Xverse wallet not found");

  const res = await provider.request("signMessage", {
    address,
    message,
    protocol: "BIP322",
  });

  if (res.status !== "success") {
    if (res.error?.code === 4001) throw new Error("USER_REJECTED");
    throw new Error(res.error?.message || "Message signing failed");
  }

  return res.result.signature;
}

export async function signPsbtInputs(
  psbtBase64: string,
  address: string,
  inputIndices: number[]
): Promise<string> {
  const provider = getXverseProvider();
  if (!provider) throw new Error("Xverse wallet not found");

  const res = await provider.request("signPsbt", {
    psbt: psbtBase64,
    signInputs: { [address]: inputIndices },
    broadcast: false,
  });

  if (res.status !== "success") {
    if (res.error?.code === 4001) throw new Error("USER_REJECTED");
    throw new Error(res.error?.message || "signPsbt failed");
  }

  return res.result.psbt;
}

export async function signPsbt(
  psbtBase64: string,
  paymentAddress: string
): Promise<string> {
  return signPsbtInputs(psbtBase64, paymentAddress, [0]);
}
