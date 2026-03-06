"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface RarityData {
  name: string;
  value: number;
  color: string;
}

export default function RarityDonut({ data }: { data: RarityData[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={80}
          outerRadius={120}
          paddingAngle={2}
          dataKey="value"
          stroke="none"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              return (
                <div className="border border-[rgba(120,72,18,0.55)] bg-[rgba(7,7,9,0.96)] p-3">
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">{data.name}</p>
                  <p className="font-mono font-medium" style={{ color: data.color }}>
                    {data.value}%
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        <Legend 
          verticalAlign="bottom" 
          height={36}
          iconType="square"
          formatter={(value) => <span className="font-mono text-sm capitalize text-zinc-500">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
