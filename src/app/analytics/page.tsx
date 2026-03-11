import { getAnalyticsData } from "@/lib/api";
import StatCard from "@/components/analytics/StatCard";
import FloorChart from "@/components/analytics/FloorChart";
import VolumeChart from "@/components/analytics/VolumeChart";
import HolderDistribution from "@/components/analytics/HolderDistribution";
import RarityDonut from "@/components/analytics/RarityDonut";
import { formatBTC, formatNumber } from "@/lib/utils";

export const revalidate = 300;

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 md:py-8">
        <section className="home-panel relative overflow-hidden px-5 py-5 md:px-7 md:py-6 mb-8">
          <div className="relative z-10">
            <p className="home-eyebrow mb-2">Market analytics</p>
            <h1 className="font-mono text-3xl font-black uppercase tracking-[-0.03em] text-primary md:text-4xl">
              Bitmap Stats
            </h1>
            <p className="mt-2 max-w-md font-mono text-sm leading-6 text-zinc-400">
              Deep-dive metrics on the Bitmap protocol, including price floors, volume, and holder distribution.
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Market Cap"
            value={formatBTC(data.stats.floorPrice * data.stats.totalSupply)}
            trend={2.4}
          />
          <StatCard
            label="Avg Price (24h)"
            value={formatBTC(data.stats.avgPrice24h)}
            trend={-1.2}
          />
          <StatCard
            label="Holders"
            value={formatNumber(data.stats.holders)}
            trend={0.18}
          />
          <StatCard
            label="Listed %"
            value={`${((data.stats.listedCount / data.stats.totalSupply) * 100).toFixed(2)}%`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="home-panel p-6">
            <h2 className="font-mono text-xl font-bold uppercase text-primary mb-6">Floor Price History</h2>
            <div className="h-[350px]">
              <FloorChart data={data.priceHistory} />
            </div>
          </div>
          <div className="home-panel p-6">
            <h2 className="font-mono text-xl font-bold uppercase text-primary mb-6">Volume Analysis</h2>
            <div className="h-[350px]">
              <VolumeChart data={data.volumeHistory} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 home-panel p-6">
            <h2 className="font-mono text-xl font-bold uppercase text-primary mb-6">Holder Distribution</h2>
            <div className="h-[300px]">
              <HolderDistribution data={data.holderDistribution} />
            </div>
          </div>
          <div className="home-panel p-6">
            <h2 className="font-mono text-xl font-bold uppercase text-primary mb-6">Rarity Mix</h2>
            <div className="h-[300px]">
              <RarityDonut data={data.rarityBreakdown} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
