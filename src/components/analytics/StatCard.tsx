import { formatPercent } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  trend?: number;
}

export default function StatCard({ label, value, trend }: StatCardProps) {
  return (
    <div className="panel-frame pixel-cut p-4 bg-surface/50 flex flex-col gap-2">
      <span className="text-[10px] uppercase tracking-[0.16em] text-text-secondary">
        {label}
      </span>
      <div className="flex items-end gap-3">
        <span className="font-mono text-xl md:text-2xl font-bold text-text-primary">
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
