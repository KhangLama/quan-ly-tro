"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calculator,
  Receipt,
  DoorOpen,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
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
    label: "Tổng quan",
    href: "/",
    icon: LayoutDashboard,
    exact: true,
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

export function BottomNav() {
  const pathname = usePathname();

  const isItemActive = (item: NavItem) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/85 backdrop-blur-xl border-t border-slate-200/70 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
      <div className="max-w-lg mx-auto px-2 h-16 flex items-center justify-around pb-safe">
        {NAV_ITEMS.map((item) => {
          const active = isItemActive(item);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-2xl transition-all duration-200 relative select-none active:scale-90",
                active
                  ? "text-indigo-600 font-extrabold"
                  : "text-slate-500 hover:text-slate-900 font-medium"
              )}
            >
              {active && (
                <span className="absolute -top-1 w-7 h-1 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full shadow-xs shadow-indigo-500/50 animate-in fade-in zoom-in-75 duration-200" />
              )}
              <div
                className={cn(
                  "p-1 rounded-xl transition-all duration-200",
                  active && "bg-indigo-50 text-indigo-600"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    active && "scale-110 text-indigo-600"
                  )}
                />
              </div>
              <span className="text-[10.5px] leading-tight tracking-tight mt-0.5">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
