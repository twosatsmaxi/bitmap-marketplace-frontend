"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface RarityData {
  name: string;
  value: number;
  color: string;
}

interface RarityDonutProps {
  data: RarityData[];
}

export default function RarityDonut({ data }: RarityDonutProps) {
  // Custom legend component for better mobile layout
  const CustomLegend = useMemo(() => {
    return (
      <div className="mt-4 grid grid-cols-2 gap-2 md:gap-3">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div
              className="h-3 w-3 flex-shrink-0 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <div className="flex flex-col">
              <span className="font-mono text-[10px] md:text-xs capitalize text-zinc-400">
                {entry.name}
              </span>
              <span
                className="font-mono text-xs md:text-sm font-bold"
                style={{ color: entry.color }}
              >
                {entry.value}%
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }, [data]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={70}
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
                      <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                        {data.name}
                      </p>
                      <p
                        className="font-mono font-medium"
                        style={{ color: data.color }}
                      >
                        {data.value}%
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {CustomLegend}
    </div>
  );
}
