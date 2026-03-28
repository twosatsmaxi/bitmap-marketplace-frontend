import { Suspense } from "react";
import { getPortfolio } from "@/lib/api";
import PortfolioGrid from "@/components/portfolio/PortfolioGrid";
import CopyAddressButton from "@/components/portfolio/CopyAddressButton";
import type { PortfolioResponse } from "@/lib/api";

export const revalidate = 60;

interface Props {
  params: Promise<{ address: string }>;
}

function truncateAddress(addr: string): string {
  if (addr.length <= 16) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
}

/** Async component that streams in after data loads */
async function PortfolioContent({ address }: { address: string }) {
  let initialData: PortfolioResponse | null;
  try {
    initialData = await getPortfolio(address, 0, 24);
  } catch {
    initialData = null;
  }

  return (
    <>
      {/* Total count badge - streams in with data */}
      {initialData && (
        <div className="br-card p-3 md:p-5 -mt-3 md:-mt-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] md:text-xs text-zinc-500 tracking-wide">
              {truncateAddress(address)}
            </span>
            <CopyAddressButton address={address} />
            <span className="border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.035)] rounded px-2 py-0.5 font-mono text-[9px] md:text-[10px] uppercase tracking-[0.16em] text-zinc-400">
              <span className="text-primary">{initialData.total}</span> bitmaps
            </span>
          </div>
        </div>
      )}
      <PortfolioGrid address={address} initialData={initialData} />
    </>
  );
}

function PortfolioSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="br-card flex flex-col overflow-hidden p-0">
          <div className="flex items-center px-2.5 py-1.5 md:px-3 md:py-2">
            <div className="h-3 w-24 rounded animate-shimmer" />
          </div>
          <div className="relative mx-2 aspect-square rounded-lg bg-[#090c11] overflow-hidden">
            <div className="absolute inset-0 animate-shimmer" />
          </div>
          <div className="flex flex-col gap-0.5 md:gap-1 px-2.5 py-2 md:px-3 md:py-3">
            <div className="h-2.5 w-16 rounded animate-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function PortfolioPage({ params }: Props) {
  const { address } = await params;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 md:gap-4 px-3 md:px-4 pb-12 pt-3 md:pt-4">
      {/* Header - renders instantly */}
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
          </div>
        </div>
      </div>

      {/* Data-dependent content streams in */}
      <Suspense fallback={<PortfolioSkeleton />}>
        <PortfolioContent address={address} />
      </Suspense>
    </div>
  );
}
