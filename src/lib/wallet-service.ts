import Wallet, { AddressPurpose, RpcErrorCode } from "sats-connect";

export interface WalletAddresses {
  paymentAddress: string;
  ordinalsAddress: string;
}

export function isWalletAvailable(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as Record<string, unknown>;
  return !!(w.XverseProviders || w.BitcoinProvider);
}

export async function connectWallet(): Promise<WalletAddresses> {
  if (!isWalletAvailable()) {
    throw new Error(
      "No Bitcoin wallet extension detected. Please install Xverse."
    );
  }

  const res = await Wallet.request("getAccounts", {
    purposes: [AddressPurpose.Payment, AddressPurpose.Ordinals],
  });

  if (res.status !== "success") {
    throw new Error("Wallet connection failed");
  }

  const payment = res.result.find(
    (a) => a.purpose === AddressPurpose.Payment
  );
  const ordinals = res.result.find(
    (a) => a.purpose === AddressPurpose.Ordinals
  );

  if (!payment?.address || !ordinals?.address) {
    throw new Error("Wallet did not return required addresses");
  }

  return {
    paymentAddress: payment.address,
    ordinalsAddress: ordinals.address,
  };
}

export async function disconnectWallet(): Promise<void> {
  try {
    await Wallet.request("wallet_renouncePermissions", undefined);
  } catch {
    // ignore errors on disconnect
  }
}

export async function signChallengeMessage(
  address: string,
  message: string
): Promise<string> {
  const res = await Wallet.request("signMessage", {
    address,
    message,
    protocol: "BIP322" as any,
  });

  if (res.status !== "success") {
    if (res.error?.code === RpcErrorCode.USER_REJECTION) {
      throw new Error("USER_REJECTED");
    }
    throw new Error(res.error?.message || "Message signing failed");
  }

  return res.result.signature;
}

export async function signPsbt(
  psbtBase64: string,
  paymentAddress: string
): Promise<string> {
  const res = await Wallet.request("signPsbt", {
    psbt: psbtBase64,
    signInputs: { [paymentAddress]: [0] },
    broadcast: false,
  } as Parameters<typeof Wallet.request<"signPsbt">>[1]);

  if (res.status !== "success") {
    if (res.error?.code === RpcErrorCode.USER_REJECTION) {
      throw new Error("USER_REJECTED");
    }
    throw new Error(res.error?.message || "signPsbt failed");
  }

  return res.result.psbt;
}

export async function signPsbtInputs(
  psbtBase64: string,
  address: string,
  inputIndices: number[]
): Promise<string> {
  const res = await Wallet.request("signPsbt", {
    psbt: psbtBase64,
    signInputs: { [address]: inputIndices },
    broadcast: false,
  } as Parameters<typeof Wallet.request<"signPsbt">>[1]);

  if (res.status !== "success") {
    if (res.error?.code === RpcErrorCode.USER_REJECTION) {
      throw new Error("USER_REJECTED");
    }
    throw new Error(res.error?.message || "signPsbt failed");
  }

  return res.result.psbt;
}
