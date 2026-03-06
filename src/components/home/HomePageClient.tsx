"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type {
  HomeMarketRow,
  HomeMarketTab,
  HomeRecentSale,
  HomeTimeframe,
} from "@/lib/types";
import { cn, formatBTC, formatNumber, timeAgo } from "@/lib/utils";

interface HomePageClientProps {
  rows: HomeMarketRow[];
  recentSales: HomeRecentSale[];
}

const tabs: { id: HomeMarketTab; label: string }[] = [
  { id: "top", label: "Top" },
  { id: "standard", label: "Standard" },
  { id: "blocktributes", label: "Blocktributes" },
];

const timeframes: HomeTimeframe[] = ["24h", "7d"];

export default function HomePageClient({
  rows,
  recentSales,
}: HomePageClientProps) {
  const [activeTab, setActiveTab] = useState<HomeMarketTab>("top");
  const [timeframe, setTimeframe] = useState<HomeTimeframe>("24h");
  const [currency, setCurrency] = useState<"BTC" | "USD">("BTC");

  const filteredRows = rows.filter((row) => {
    if (activeTab === "top") return true;
    if (activeTab === "standard") return row.kind === "standard";
    return row.kind === "blocktribute";
  });
  const pixelPattern = useMemo(
    () => [
      { x: 0, y: 0, w: 3, h: 3, o: 0.2 },
      { x: 4, y: 0, w: 4, h: 2, o: 0.14 },
      { x: 9, y: 0, w: 3, h: 4, o: 0.17 },
      { x: 13, y: 1, w: 5, h: 3, o: 0.12 },
      { x: 19, y: 0, w: 3, h: 2, o: 0.16 },
      { x: 23, y: 0, w: 4, h: 4, o: 0.13 },
      { x: 28, y: 1, w: 3, h: 3, o: 0.18 },
      { x: 32, y: 0, w: 4, h: 2, o: 0.12 },
      { x: 37, y: 0, w: 3, h: 4, o: 0.15 },
      { x: 2, y: 6, w: 5, h: 3, o: 0.12 },
      { x: 8, y: 7, w: 3, h: 5, o: 0.18 },
      { x: 12, y: 6, w: 4, h: 3, o: 0.14 },
      { x: 17, y: 7, w: 3, h: 4, o: 0.16 },
      { x: 21, y: 6, w: 5, h: 3, o: 0.12 },
      { x: 27, y: 7, w: 3, h: 5, o: 0.18 },
      { x: 31, y: 6, w: 4, h: 3, o: 0.14 },
      { x: 36, y: 7, w: 4, h: 4, o: 0.16 },
      { x: 0, y: 13, w: 4, h: 3, o: 0.14 },
      { x: 5, y: 12, w: 3, h: 5, o: 0.18 },
      { x: 9, y: 13, w: 5, h: 3, o: 0.12 },
      { x: 15, y: 12, w: 3, h: 4, o: 0.16 },
      { x: 19, y: 13, w: 4, h: 3, o: 0.13 },
      { x: 24, y: 12, w: 3, h: 5, o: 0.18 },
      { x: 28, y: 13, w: 5, h: 3, o: 0.12 },
      { x: 34, y: 12, w: 4, h: 4, o: 0.15 },
    ],
    []
  );
  const panelPixels = useMemo(
    () => [
      { x: 2, y: 1, delay: "0.2s", duration: "3.6s" },
      { x: 4, y: 2, delay: "1.1s", duration: "4.2s" },
      { x: 6, y: 3, delay: "0.6s", duration: "4.6s" },
      { x: 8, y: 1, delay: "1.7s", duration: "3.9s" },
      { x: 11, y: 2, delay: "0.8s", duration: "4.1s" },
      { x: 13, y: 4, delay: "2.2s", duration: "4.8s" },
      { x: 15, y: 4, delay: "1.3s", duration: "3.7s" },
      { x: 19, y: 1, delay: "1s", duration: "4.5s" },
      { x: 22, y: 2, delay: "2.1s", duration: "3.8s" },
      { x: 24, y: 3, delay: "1.6s", duration: "4.4s" },
      { x: 27, y: 1, delay: "0.4s", duration: "4.9s" },
      { x: 29, y: 2, delay: "2.4s", duration: "3.6s" },
      { x: 33, y: 4, delay: "1.9s", duration: "4.2s" },
      { x: 36, y: 2, delay: "0.9s", duration: "4.7s" },
      { x: 5, y: 8, delay: "1.2s", duration: "4.3s" },
      { x: 7, y: 9, delay: "2.7s", duration: "3.8s" },
      { x: 10, y: 10, delay: "0.7s", duration: "4s" },
      { x: 12, y: 7, delay: "1.8s", duration: "4.6s" },
      { x: 16, y: 8, delay: "2.3s", duration: "3.9s" },
      { x: 18, y: 10, delay: "1.4s", duration: "4.5s" },
      { x: 21, y: 10, delay: "2.6s", duration: "4.1s" },
      { x: 24, y: 8, delay: "0.5s", duration: "3.7s" },
      { x: 27, y: 8, delay: "2.9s", duration: "4.8s" },
      { x: 31, y: 10, delay: "0.6s", duration: "4.2s" },
      { x: 35, y: 9, delay: "1.5s", duration: "3.9s" },
      { x: 37, y: 7, delay: "2.8s", duration: "4.4s" },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-bg">
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-12 pt-6 md:px-6 md:gap-7 md:pb-16 md:pt-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-90">
          <div className="home-pixel-grid">
            {pixelPattern.map((pixel, index) => (
              <span
                key={index}
                className="home-pixel"
                style={{
                  left: `${pixel.x * 2.45}%`,
                  top: `${pixel.y * 5.8}%`,
                  width: `${pixel.w * 52}px`,
                  height: `${pixel.h * 52}px`,
                  opacity: pixel.o,
                }}
              />
            ))}
          </div>
        </div>
        <section className="home-panel relative overflow-hidden px-5 py-5 md:px-7 md:py-6">
          <PanelPixels pixels={panelPixels} />
          <div className="home-orb home-orb-a" />
          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-[44rem]">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <span className="home-live-pill">
                  <span className="home-live-dot" />
                  Live
                </span>
                <span className="home-chip">bitmap</span>
                <span className="home-chip">blocktributes</span>
              </div>
              <p className="home-eyebrow">Ordinal market board</p>
              <h1 className="mt-2 max-w-2xl text-4xl font-black uppercase tracking-[-0.03em] text-primary md:text-[4.25rem] md:leading-none">
                Bitmap Marketplace
              </h1>
              <p className="mt-3 max-w-2xl font-mono text-sm leading-6 text-zinc-400 md:text-[15px]">
                Floors, volume, sales, and listing pressure across Bitmap,
                Patoshi, Billionaire, Bitmap Punk, Sub 100k, and the rest of
                the Bitmap market.
              </p>
            </div>

            <div className="flex flex-col items-start gap-4 lg:min-w-[220px] lg:items-end">
              <CurrencyToggle value={currency} onChange={setCurrency} />
              <Link
                href="/browse"
                className="home-button inline-flex items-center justify-center"
              >
                See all
              </Link>
            </div>
          </div>
        </section>

        <section className="home-panel px-3 py-3 md:px-4">
          <PanelPixels pixels={panelPixels} />
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "rounded-md px-4 py-2 font-mono text-sm font-bold uppercase tracking-[0.14em] transition-colors",
                    activeTab === tab.id
                      ? "bg-primary text-black"
                      : "bg-zinc-950 text-text-secondary hover:bg-primary/10 hover:text-primary"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 self-start rounded-md border border-primary/20 bg-zinc-950/80 p-1">
              {timeframes.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setTimeframe(option)}
                  className={cn(
                    "rounded-md px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.18em] transition-colors",
                    timeframe === option
                      ? "bg-primary text-black"
                      : "text-text-secondary hover:text-primary"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="home-panel overflow-hidden">
          <PanelPixels pixels={panelPixels} />
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="text-left">
                  <HeaderCell>#</HeaderCell>
                  <HeaderCell>Trait / Category</HeaderCell>
                  <HeaderCell>Floor</HeaderCell>
                  <HeaderCell>Volume</HeaderCell>
                  <HeaderCell>Sales</HeaderCell>
                  <HeaderCell>Listed</HeaderCell>
                  <HeaderCell>Last {timeframe}</HeaderCell>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, index) => (
                  <tr
                    key={row.id}
                    className="group transition-colors hover:bg-primary/[0.03]"
                  >
                    <BodyCell className="w-14 border-t border-[rgba(247,147,26,0.16)] text-text-secondary group-hover:border-[rgba(247,147,26,0.22)]">
                      {index + 1}
                    </BodyCell>
                    <BodyCell className="min-w-[220px] border-t border-[rgba(247,147,26,0.16)] group-hover:border-[rgba(247,147,26,0.22)]">
                      <div className="flex flex-col gap-1">
                        <div className="font-mono text-base font-bold uppercase text-primary">
                          {row.name}
                        </div>
                        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                          {row.kind}
                        </div>
                      </div>
                    </BodyCell>
                    <BodyCell className="border-t border-[rgba(247,147,26,0.16)] font-mono font-bold text-primary group-hover:border-[rgba(247,147,26,0.22)]">
                      {formatValue(row.floor, currency)}
                    </BodyCell>
                    <BodyCell className="border-t border-[rgba(247,147,26,0.16)] font-mono group-hover:border-[rgba(247,147,26,0.22)]">{formatValue(row.volume[timeframe], currency)}</BodyCell>
                    <BodyCell className="border-t border-[rgba(247,147,26,0.16)] font-mono group-hover:border-[rgba(247,147,26,0.22)]">{formatNumber(row.sales[timeframe])}</BodyCell>
                    <BodyCell className="border-t border-[rgba(247,147,26,0.16)] group-hover:border-[rgba(247,147,26,0.22)]">{row.listedPercent.toFixed(1)}%</BodyCell>
                    <BodyCell className="w-[170px] border-t border-[rgba(247,147,26,0.16)] group-hover:border-[rgba(247,147,26,0.22)]">
                      <Sparkline points={row.trendPoints} />
                    </BodyCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="home-panel px-5 py-5 md:px-6">
          <PanelPixels pixels={panelPixels} />
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="home-eyebrow">Recent Sales</p>
              <h2 className="mt-2 font-mono text-xl font-bold uppercase text-primary">
                Market tape
              </h2>
            </div>
            <Link
              href="/activity"
              className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-text-secondary transition-colors hover:text-primary"
            >
              View activity
            </Link>
          </div>

          <div className="overflow-hidden rounded-md border border-[rgba(120,72,18,0.55)] bg-black/35">
            <div className="grid grid-cols-[1.6fr,1fr,0.8fr] border-b border-[rgba(120,72,18,0.55)] px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              <div>Bitmap</div>
              <div>Price</div>
              <div className="text-right">Time</div>
            </div>
            {recentSales.map((sale, index) => (
              <div
                key={sale.id}
                className={cn(
                  "grid grid-cols-[1.6fr,1fr,0.8fr] items-center px-4 py-3 transition-colors hover:bg-primary/[0.03]",
                  index > 0 && "border-t border-[rgba(120,72,18,0.45)]"
                )}
              >
                <div className="min-w-0">
                  <div className="truncate font-mono text-sm font-bold uppercase text-primary">
                    {sale.bitmapId}
                  </div>
                  <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    {sale.traitName}
                  </div>
                </div>
                <div className="font-mono text-sm font-bold text-primary">
                  {formatValue(sale.price, currency)}
                </div>
                <div className="text-right font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                  {timeAgo(sale.soldAt)}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function HeaderCell({ children }: { children: React.ReactNode }) {
  return (
    <th className="border-b border-[rgba(120,72,18,0.55)] px-5 py-4 text-left font-mono text-xs font-bold uppercase tracking-[0.22em] text-zinc-500">
      {children}
    </th>
  );
}

function BodyCell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={cn("px-5 py-5 text-sm text-zinc-400", className)}>
      {children}
    </td>
  );
}

function CurrencyToggle({
  value,
  onChange,
}: {
  value: "BTC" | "USD";
  onChange: (value: "BTC" | "USD") => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-primary/20 bg-zinc-950/80 p-1">
      {(["BTC", "USD"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "rounded-md px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.2em] transition-colors",
            value === option
              ? "bg-primary text-black"
              : "text-text-secondary hover:text-primary"
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function PanelPixels({
  pixels,
}: {
  pixels: { x: number; y: number; delay: string; duration: string }[];
}) {
  return (
    <div className="panel-pixel-grid" aria-hidden="true">
      {pixels.map((pixel, index) => (
        <span
          key={index}
          className="panel-pixel"
          style={{
            left: `calc(${pixel.x} * var(--home-grid-size))`,
            top: `calc(${pixel.y} * var(--home-grid-size))`,
            animationDelay: pixel.delay,
            animationDuration: pixel.duration,
          }}
        />
      ))}
    </div>
  );
}

function Sparkline({ points }: { points: number[] }) {
  const width = 120;
  const height = 36;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const d = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - ((point - min) / range) * (height - 6) - 3;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-9 w-full max-w-[130px]"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={d}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-primary"
      />
    </svg>
  );
}

function formatValue(value: number, currency: "BTC" | "USD") {
  if (currency === "BTC") {
    return formatBTC(value);
  }

  const usd = value / 100_000_000 * 91_500;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: usd >= 100 ? 0 : 2,
  }).format(usd);
}
