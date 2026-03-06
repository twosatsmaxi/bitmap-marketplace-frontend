import { formatPercent } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  trend?: number;
}

export default function StatCard({ label, value, trend }: StatCardProps) {
  return (
    <div className="home-panel flex flex-col gap-2 px-4 py-4">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </span>
      <div className="flex items-end gap-3">
        <span className="font-mono text-xl font-bold text-primary md:text-2xl">
          {value}
        </span>
        {trend !== undefined && (
          <span className={`text-sm font-mono mb-1 ${trend >= 0 ? "text-success" : "text-danger"}`}>
            {formatPercent(trend)}
          </span>
        )}
      </div>
    </div>
  );
}
