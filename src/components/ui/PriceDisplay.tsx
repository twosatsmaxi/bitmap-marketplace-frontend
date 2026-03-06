import { cn, formatBTC } from "@/lib/utils";

interface PriceDisplayProps {
  price?: number;
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function PriceDisplay({
  price,
  label,
  className,
  size = "md",
}: PriceDisplayProps) {
  if (price === undefined) {
    return <div className={cn("text-text-secondary text-xs font-mono uppercase tracking-widest", className)}>Not for sale</div>;
  }

  const sizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-xl",
  };

  return (
    <div className={cn("flex flex-col", className)}>
      {label && <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-text-secondary mb-1">{label}</span>}
      <div className="flex items-center gap-1.5">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-primary"
        >
          <path
            d="M15.4167 15.0833C15.4167 16.9242 13.9242 18.4167 12.0833 18.4167H8.75V15.0833H12.0833C12.5186 15.0833 12.875 14.7269 12.875 14.2917C12.875 13.8564 12.5186 13.5 12.0833 13.5H8.75V10.1667H11.25C11.6853 10.1667 12.0417 9.81024 12.0417 9.375C12.0417 8.93976 11.6853 8.58333 11.25 8.58333H8.75V5.25H12.0833C13.9242 5.25 15.4167 6.74247 15.4167 8.58333C15.4167 9.77884 14.7876 10.8267 13.8447 11.3968C14.7876 11.967 15.4167 13.0148 15.4167 14.2083V15.0833Z"
            fill="currentColor"
          />
        </svg>
        <span className={cn("font-mono font-bold tracking-tight text-text-primary", sizes[size])}>
          {formatBTC(price)}
        </span>
      </div>
    </div>
  );
}
