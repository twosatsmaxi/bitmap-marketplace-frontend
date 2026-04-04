import { cn } from "@/lib/utils";

type CardVariant = "default" | "panel" | "frame" | "row";

interface CardProps extends React.HTMLAttributes<HTMLElement> {
  variant?: CardVariant;
  hover?: boolean;
  as?: React.ElementType;
  children: React.ReactNode;
}

/**
 * Unified Card component wrapping the codebase's four card patterns:
 *
 *   default — .br-card (subtle white border, rounded-[10px], surface gradient)
 *   panel   — .home-panel (warm amber border, rounded-2xl, pixel-grid overlay)
 *   frame   — .panel-frame (blurred surface, primary corner accents)
 *   row     — border-b divider style for stacked list items
 */
export default function Card({
  variant = "default",
  hover = false,
  as: Tag = "div",
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <Tag
      className={cn(
        // ---------- variant base ----------
        variant === "default" && "br-card",
        variant === "panel" && "home-panel",
        variant === "frame" && "panel-frame",
        variant === "row" && [
          "border-b border-[rgba(120,72,18,0.35)]",
          "bg-[rgba(7,7,9,0.5)]",
          "p-4",
          "last:border-b-0",
        ],

        // ---------- hover ----------
        hover &&
          "transition-colors hover:border-primary/30",
        hover &&
          variant === "row" &&
          "hover:bg-[rgba(247,147,26,0.03)]",

        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
