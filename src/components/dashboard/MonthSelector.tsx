"use client";

import React from "react";
import { VietnameseMonthPicker } from "@/components/ui/VietnameseMonthPicker";

interface MonthSelectorProps {
  currentMonth: string; // YYYY-MM
  onMonthChange: (month: string) => void;
}

export function MonthSelector({ currentMonth, onMonthChange }: MonthSelectorProps) {
  return (
    <div className="flex items-center justify-center bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 p-2 sm:p-2.5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] transition-all duration-200">
      <VietnameseMonthPicker
        value={currentMonth}
        onChange={onMonthChange}
        showQuickNav={true}
      />
    </div>
  );
}
