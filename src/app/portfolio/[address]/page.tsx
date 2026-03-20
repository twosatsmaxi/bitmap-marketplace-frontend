import { Suspense } from "react";
import { getPortfolio } from "@/lib/api";
import PortfolioGrid from "@/components/portfolio/PortfolioGrid";
import CopyAddressButton from "@/components/portfolio/CopyAddressButton";

interface Props {
  params: Promise<{ address: string }>;
}

function truncateAddress(addr: string): string {
  if (addr.length <= 16) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
}

export default async function PortfolioPage({ params }: Props) {
  const { address } = await params;

  let initialData;
  try {
    initialData = await getPortfolio(address, 0, 24);
  } catch {
    initialData = null;
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 md:gap-4 px-3 md:px-4 pb-12 pt-3 md:pt-4">
      {/* Header */}
      <div className="br-card p-3 md:p-5">
        <div className="flex flex-col gap-1">
          <h1 className="font-mono text-lg font-black uppercase tracking-[0.1em] text-primary md:text-2xl">
            Bitmap Portfolio
          </h1>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] md:text-xs text-zinc-500 tracking-wide">
              {truncateAddress(address)}
            </span>
            <CopyAddressButton address={address} />
            {initialData && (
              <span className="border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.035)] rounded px-2 py-0.5 font-mono text-[9px] md:text-[10px] uppercase tracking-[0.16em] text-zinc-400">
                <span className="text-primary">{initialData.total}</span> bitmaps
              </span>
            )}
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        <PortfolioGrid address={address} initialData={initialData} />
      </Suspense>
    </div>
  );
}
