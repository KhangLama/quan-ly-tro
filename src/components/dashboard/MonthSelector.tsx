"use client";

import React from "react";
import { VietnameseMonthPicker } from "@/components/ui/VietnameseMonthPicker";

interface MonthSelectorProps {
  currentMonth: string; // YYYY-MM
  onMonthChange: (month: string) => void;
}

export function MonthSelector({ currentMonth, onMonthChange }: MonthSelectorProps) {
  return (
    <div className="flex items-center justify-center bg-white rounded-2xl border border-slate-200/80 p-2 shadow-xs">
      <VietnameseMonthPicker
        value={currentMonth}
        onChange={onMonthChange}
        showQuickNav={true}
      />
    </div>
  );
}
