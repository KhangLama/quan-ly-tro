import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost" | "success";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex flex-row flex-nowrap items-center justify-center font-bold rounded-xl transition-all duration-200 focus:outline-hidden focus:ring-2 focus:ring-offset-2 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 select-none whitespace-nowrap cursor-pointer";

    const variantStyles = {
      primary:
        "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-500 hover:to-indigo-600 focus:ring-indigo-500 shadow-sm shadow-indigo-600/25 hover:shadow-md hover:shadow-indigo-600/30",
      secondary:
        "bg-slate-100 text-slate-800 hover:bg-slate-200/90 focus:ring-slate-400",
      outline:
        "border border-slate-200/90 bg-white/90 text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 focus:ring-indigo-500 shadow-2xs",
      danger:
        "bg-gradient-to-r from-rose-600 to-rose-700 text-white hover:from-rose-500 hover:to-rose-600 focus:ring-rose-500 shadow-sm shadow-rose-600/25",
      ghost:
        "text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-400",
      success:
        "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-500 hover:to-emerald-600 focus:ring-emerald-500 shadow-sm shadow-emerald-600/25",
    };

    const sizeStyles = {
      sm: "h-9 px-3 text-xs gap-1.5",
      md: "h-10.5 px-4 text-sm gap-2",
      lg: "h-12 px-6 text-base gap-2.5",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="inline-flex flex-row flex-nowrap items-center justify-center gap-1.5 whitespace-nowrap">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            <span>{loadingText || children}</span>
          </span>
        ) : (
          <span className="inline-flex flex-row flex-nowrap items-center justify-center gap-1.5 whitespace-nowrap">
            {leftIcon && <span className="shrink-0 flex items-center justify-center">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0 flex items-center justify-center">{rightIcon}</span>}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
