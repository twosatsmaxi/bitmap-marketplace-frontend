"use client";

import type { PriceDataPoint } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function FloorChart({ data }: { data: PriceDataPoint[] }) {
  const formatYAxis = (tickItem: number) => {
    if (tickItem >= 100000000) return `${(tickItem / 100000000).toFixed(2)} BTC`;
    if (tickItem >= 1000000) return `${(tickItem / 1000000).toFixed(1)}M sats`;
    return `${formatNumber(tickItem)} sats`;
  };

  const formatDateAxis = (tickItem: string) => {
    return new Date(tickItem).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorFloor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#F7A90C" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#F7A90C" stopOpacity={0} />
          </linearGradient>
        </defs>
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
          content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="border border-[rgba(120,72,18,0.55)] bg-[rgba(7,7,9,0.96)] p-3">
                    <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">{label}</p>
                    <p className="text-primary font-mono font-medium">
                      {formatNumber(payload[0].value as number)} sats
                    </p>
                </div>
              );
            }
            return null;
          }}
        />
        <Area
          type="monotone"
          dataKey="price"
          stroke="#F7A90C"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorFloor)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
