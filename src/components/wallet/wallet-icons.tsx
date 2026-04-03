import { type WalletProvider } from "@/lib/wallet-service";

export const WALLET_ICONS: Record<WalletProvider, React.ReactNode> = {
  xverse: (
    <svg viewBox="0 0 40 40" className="h-10 w-10" fill="none">
      <rect width="40" height="40" rx="8" fill="#1A1A2E" />
      <path d="M12 28L20 12L28 28" stroke="#EE7A30" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 22H25" stroke="#EE7A30" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
  unisat: (
    <svg viewBox="0 0 40 40" className="h-10 w-10" fill="none">
      <rect width="40" height="40" rx="8" fill="#1A1A2E" />
      <path d="M14 26C14 26 16 18 20 18C24 18 26 26 26 26" stroke="#F7931A" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="20" cy="14" r="2.5" fill="#F7931A" />
    </svg>
  ),
};
