"use client";

import * as React from "react";
import { Building2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function Header() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      setIsLoggingOut(true);
      try {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
      } catch {
        router.push("/login");
      } finally {
        setIsLoggingOut(false);
      }
    }
  };

  // Format today's date in Vietnamese (e.g. "T8, 2026")
  const todayFormatted = React.useMemo(() => {
    const d = new Date();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    return `Tháng ${month.toString().padStart(2, "0")}/${year}`;
  }, []);

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-sm shadow-sky-600/20">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-none">
              Nhà trọ Trúc Lam
            </h1>
            <span className="text-[11px] font-medium text-slate-500">
              {todayFormatted}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            title="Đăng xuất"
            aria-label="Đăng xuất"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </div>
    </header>
  );
}
