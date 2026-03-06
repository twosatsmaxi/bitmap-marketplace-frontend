"use client";

import type { PriceDataPoint } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function VolumeChart({ data }: { data: PriceDataPoint[] }) {
  const formatYAxis = (tickItem: number) => {
    if (tickItem >= 100000000) return `${(tickItem / 100000000).toFixed(2)} BTC`;
    if (tickItem >= 1000000) return `${(tickItem / 1000000).toFixed(1)}M`;
    return formatNumber(tickItem);
  };

  const formatDateAxis = (tickItem: string) => {
    return new Date(tickItem).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2A2A2A" />
        <XAxis 
          dataKey="date" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 10, fill: '#8A8A8A' }}
          tickFormatter={formatDateAxis}
          minTickGap={30}
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 10, fill: '#8A8A8A', fontFamily: 'monospace' }}
          tickFormatter={formatYAxis}
          width={80}
        />
        <Tooltip 
          cursor={{ fill: '#2A2A2A', opacity: 0.4 }}
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="border border-[rgba(120,72,18,0.55)] bg-[rgba(7,7,9,0.96)] p-3">
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">{label}</p>
                  <p className="font-mono font-medium text-primary">
                    {formatNumber(payload[0].value as number)} sats
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        <Bar dataKey="volume" fill="#82C7FF" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
