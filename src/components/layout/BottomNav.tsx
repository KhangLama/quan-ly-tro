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
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-lg">
      <div className="max-w-lg mx-auto px-3 h-16 flex items-center justify-around pb-safe">
        {NAV_ITEMS.map((item) => {
          const active = isItemActive(item);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-xl transition-all duration-150 relative",
                active
                  ? "text-sky-600 font-semibold"
                  : "text-slate-500 hover:text-slate-800 font-medium"
              )}
            >
              {active && (
                <span className="absolute top-1 w-8 h-1 bg-sky-600 rounded-full animate-in fade-in zoom-in-75 duration-150" />
              )}
              <Icon
                className={cn(
                  "h-5 w-5 mb-0.5 transition-transform duration-150",
                  active && "scale-110 text-sky-600"
                )}
              />
              <span className="text-[11px] leading-tight tracking-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
