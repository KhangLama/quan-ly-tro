"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  LogOut,
  LayoutDashboard,
  Calculator,
  Receipt,
  DoorOpen,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DESKTOP_NAV_ITEMS = [
  {
    label: "Tổng quan",
    href: "/",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Chốt số",
    href: "/invoices/new",
    icon: Calculator,
  },
  {
    label: "Chi phí",
    href: "/expenses",
    icon: Receipt,
  },
  {
    label: "Phòng trọ",
    href: "/rooms",
    icon: DoorOpen,
  },
  {
    label: "Cài đặt",
    href: "/settings",
    icon: Settings,
  },
];

export function Header() {
  const pathname = usePathname();
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

  const isItemActive = (item: (typeof DESKTOP_NAV_ITEMS)[0]) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  // Format today's date in Vietnamese (e.g. "T8, 2026")
  const todayFormatted = React.useMemo(() => {
    const d = new Date();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    return `Tháng ${month.toString().padStart(2, "0")}/${year}`;
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200/70 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] transition-all">
      <div className="max-w-[1720px] 2xl:max-w-[1840px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 h-16 flex items-center justify-between gap-4">
        {/* Brand & Logo */}
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-indigo-500/30 flex items-center justify-center text-white shadow-md shadow-indigo-600/25 transition-all duration-300">
            <Building2 className="h-5 w-5 transition-transform group-hover:rotate-[-4deg]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-slate-900 leading-tight tracking-tight group-hover:text-indigo-600 transition-colors">
                Nhà trọ Trúc Lam
              </h1>
              <span className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100/80">
                Host
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-500 block">
              {todayFormatted}
            </span>
          </div>
        </Link>

        {/* Desktop Top Navigation Menu */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/70 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]">
          {DESKTOP_NAV_ITEMS.map((item) => {
            const active = isItemActive(item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 relative",
                  active
                    ? "bg-white text-indigo-600 shadow-sm shadow-slate-900/5 -translate-y-0.5"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 transition-transform duration-200",
                    active ? "text-indigo-600 scale-110" : "text-slate-400 group-hover:text-slate-600"
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User / Logout button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            title="Đăng xuất"
            aria-label="Đăng xuất"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50/80 active:scale-95 rounded-xl transition-all duration-200 disabled:opacity-50 border border-transparent hover:border-rose-100"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </div>
    </header>
  );
}
