import { getAnalyticsData } from "@/lib/api";
import StatCard from "@/components/analytics/StatCard";
import FloorChart from "@/components/analytics/FloorChart";
import VolumeChart from "@/components/analytics/VolumeChart";
import HolderDistribution from "@/components/analytics/HolderDistribution";
import RarityDonut from "@/components/analytics/RarityDonut";
import { formatSats, formatNumber, formatPercent } from "@/lib/utils";

export const revalidate = 60;

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="font-heading font-bold text-3xl md:text-4xl text-text-primary mb-4">
            Collection Analytics
          </h1>
          <p className="text-text-secondary font-mono tracking-wide max-w-2xl text-sm">
            Macro insights, floor dynamics, and ownership distribution for the Bitmap ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Floor Price" value={formatSats(data.stats.floorPrice)} trend={data.stats.change24h} />
          <StatCard label="24h Volume" value={formatSats(data.stats.totalVolume)} />
          <StatCard label="Listed" value={`${formatNumber(data.stats.listedCount)} (${((data.stats.listedCount / data.stats.totalSupply) * 100).toFixed(1)}%)`} />
          <StatCard label="Holders" value={formatNumber(data.stats.holders)} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="panel-frame pixel-cut p-5 flex flex-col h-[400px]">
            <h2 className="font-heading font-bold text-lg mb-4">Floor Price History</h2>
            <div className="flex-1 min-h-0">
              <FloorChart data={data.priceHistory} />
            </div>
          </div>
          <div className="panel-frame pixel-cut p-5 flex flex-col h-[400px]">
            <h2 className="font-heading font-bold text-lg mb-4">Volume History</h2>
            <div className="flex-1 min-h-0">
              <VolumeChart data={data.volumeHistory} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="panel-frame pixel-cut p-5 flex flex-col h-[400px]">
            <h2 className="font-heading font-bold text-lg mb-4">Holder Distribution</h2>
            <div className="flex-1 min-h-0">
              <HolderDistribution data={data.holderDistribution} />
            </div>
          </div>
          <div className="panel-frame pixel-cut p-5 flex flex-col h-[400px]">
            <h2 className="font-heading font-bold text-lg mb-4">Pattern Rarity Breakdown</h2>
            <div className="flex-1 min-h-0">
              <RarityDonut data={data.rarityBreakdown} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
