"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = React.useCallback(
    (message: string, type: ToastType = "info", duration = 3000) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setToasts((prev) => [...prev, { id, message, type, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = React.useCallback(
    (message: string, duration?: number) => showToast(message, "success", duration),
    [showToast]
  );

  const error = React.useCallback(
    (message: string, duration?: number) => showToast(message, "error", duration),
    [showToast]
  );

  const info = React.useCallback(
    (message: string, duration?: number) => showToast(message, "info", duration),
    [showToast]
  );

  const warning = React.useCallback(
    (message: string, duration?: number) => showToast(message, "warning", duration),
    [showToast]
  );

  const value = React.useMemo(
    () => ({ showToast, success, error, info, warning }),
    [showToast, success, error, info, warning]
  );

  const iconMap = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />,
    warning: <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />,
    info: <Info className="h-5 w-5 text-sky-500 shrink-0" />,
  };

  const bgMap = {
    success: "border-emerald-200 bg-emerald-50/95 text-emerald-950",
    error: "border-rose-200 bg-rose-50/95 text-rose-950",
    warning: "border-amber-200 bg-amber-50/95 text-amber-950",
    info: "border-sky-200 bg-sky-50/95 text-sky-950",
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast Render Portal */}
      <div className="fixed top-4 inset-x-0 z-50 flex flex-col items-center pointer-events-none px-4 gap-2">
        {toasts.map((toast) => {
          const type = toast.type || "info";
          return (
            <div
              key={toast.id}
              role="status"
              className={cn(
                "pointer-events-auto flex items-center gap-3 w-full max-w-sm px-4 py-3 rounded-2xl border shadow-lg backdrop-blur-md transition-all duration-200 animate-in slide-in-from-top-3 fade-in",
                bgMap[type]
              )}
            >
              {iconMap[type]}
              <p className="text-sm font-medium flex-1 break-words">{toast.message}</p>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                aria-label="Đóng thông báo"
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
