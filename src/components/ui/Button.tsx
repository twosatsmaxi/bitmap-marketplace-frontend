"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-black border-transparent hover:bg-primary/80",
  secondary:
    "bg-zinc-800 text-zinc-200 border-[rgba(120,72,18,0.55)] hover:bg-zinc-700",
  ghost:
    "bg-transparent text-zinc-400 border-transparent hover:text-white hover:bg-zinc-800/50",
  danger:
    "bg-red-500/10 text-red-400 border-transparent hover:bg-red-500/20",
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children?: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      className,
      children,
      ...rest
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          "inline-flex items-center justify-center gap-2 border font-mono font-bold uppercase tracking-[0.12em] transition-colors",
          "disabled:opacity-50 disabled:pointer-events-none",
          VARIANT_STYLES[variant],
          SIZE_STYLES[size],
          className,
        )}
        {...rest}
      >
        {loading && (
          <span
            className="inline-block h-3.5 w-3.5 animate-spin border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
