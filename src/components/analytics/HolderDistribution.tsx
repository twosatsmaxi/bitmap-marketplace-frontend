"use client";

import type { HolderBucket } from "@/lib/types";
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

export default function HolderDistribution({ data }: { data: HolderBucket[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#2A2A2A" />
        <XAxis 
          type="number"
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 10, fill: '#8A8A8A', fontFamily: 'monospace' }}
          tickFormatter={formatNumber}
        />
        <YAxis 
          dataKey="label"
          type="category"
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 12, fill: '#E0E0E0' }}
          width={80}
        />
        <Tooltip 
          cursor={{ fill: '#2A2A2A', opacity: 0.4 }}
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-bg border border-border p-3 panel-frame pixel-cut">
                  <p className="text-[10px] text-text-secondary mb-1">Items Owned: {label}</p>
                  <p className="text-[#69D6AA] font-mono font-medium">
                    {formatNumber(payload[0].value as number)} wallets
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        <Bar dataKey="count" fill="#69D6AA" radius={[0, 2, 2, 0]} barSize={24} />
      </BarChart>
    </ResponsiveContainer>
  );
}
