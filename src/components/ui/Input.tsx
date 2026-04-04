"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  TextInput                                                                  */
/* -------------------------------------------------------------------------- */

interface TextInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  label?: string;
  icon?: ReactNode;
  error?: string;
  className?: string;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, icon, error, className, id, ...rest }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        {label && (
          <label
            htmlFor={inputId}
            className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-zinc-500 [&_svg]:h-4 [&_svg]:w-4">{icon}</span>
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full border bg-[rgba(10,10,12,0.92)] px-3 py-2 font-mono text-xs uppercase tracking-[0.14em] text-zinc-300 transition-colors",
              "placeholder:text-zinc-600",
              "focus:outline-none focus:ring-1",
              error
                ? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                : "border-[rgba(120,72,18,0.55)] focus:border-primary focus:ring-primary/20",
              icon && "pl-9"
            )}
            {...rest}
          />
        </div>

        {error && (
          <span className="font-mono text-[10px] text-red-400">{error}</span>
        )}
      </div>
    );
  }
);

TextInput.displayName = "TextInput";

/* -------------------------------------------------------------------------- */
/*  Checkbox                                                                   */
/* -------------------------------------------------------------------------- */

interface CheckboxProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export function Checkbox({ label, checked, onChange, className }: CheckboxProps) {
  return (
    <label className={cn("flex cursor-pointer items-center gap-3 group", className)}>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative flex h-4 w-4 shrink-0 items-center justify-center border transition-colors",
          checked
            ? "border-primary bg-primary"
            : "border-zinc-600 bg-transparent group-hover:border-primary/50"
        )}
      >
        {checked && <div className="h-2 w-2 bg-black" />}
      </button>

      {label && (
        <span className="font-mono text-sm uppercase tracking-[0.08em] text-zinc-400 transition-colors group-hover:text-primary">
          {label}
        </span>
      )}
    </label>
  );
}
