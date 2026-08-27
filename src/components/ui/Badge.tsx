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
    default: "bg-slate-100 text-slate-700 border-slate-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200 font-medium",
    warning: "bg-amber-50 text-amber-700 border-amber-200 font-medium",
    danger: "bg-rose-50 text-rose-700 border-rose-200 font-medium",
    secondary: "bg-slate-100 text-slate-500 border-slate-200",
    info: "bg-sky-50 text-sky-700 border-sky-200 font-medium",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs rounded-md",
    md: "px-2.5 py-1 text-xs rounded-lg",
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
