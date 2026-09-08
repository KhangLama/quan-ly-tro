import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "secondary" | "info";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-slate-100/80 text-slate-700 border-slate-200/80",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200/80 font-semibold shadow-2xs",
    warning: "bg-amber-50 text-amber-800 border-amber-200/80 font-semibold shadow-2xs",
    danger: "bg-rose-50 text-rose-700 border-rose-200/80 font-semibold shadow-2xs",
    secondary: "bg-slate-100/90 text-slate-600 border-slate-200/80 font-medium",
    info: "bg-indigo-50 text-indigo-700 border-indigo-200/80 font-semibold shadow-2xs",
  };

  const sizeStyles = {
    sm: "px-2.5 py-0.5 text-[11px] rounded-full tracking-tight",
    md: "px-3 py-1 text-xs rounded-full tracking-tight",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border font-medium transition-colors select-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
