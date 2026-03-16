import { cn, formatPercent } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  trend?: number;
}

export default function StatCard({ label, value, trend }: StatCardProps) {
  return (
    <div className="home-panel flex flex-col gap-1.5 md:gap-2 px-3 py-3 md:px-4 md:py-4">
      <span className="font-mono text-[9px] md:text-[10px] uppercase tracking-[0.14em] md:tracking-[0.16em] text-zinc-500 line-clamp-1">
        {label}
      </span>
      <div className="flex items-end gap-2 md:gap-3">
        <span className="font-mono text-base md:text-xl lg:text-2xl font-bold text-primary truncate">
          {value}
        </span>
        {trend !== undefined && (
          <span
            className={cn(
              "text-xs md:text-sm font-mono mb-0.5 md:mb-1",
              trend >= 0 ? "text-success" : "text-danger"
            )}
          >
            {formatPercent(trend)}
          </span>
        )}
      </div>
    </div>
  );
}
