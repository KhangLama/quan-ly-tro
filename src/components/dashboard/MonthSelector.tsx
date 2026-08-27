"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface MonthSelectorProps {
  currentMonth: string; // YYYY-MM
  onMonthChange: (month: string) => void;
}

export function MonthSelector({ currentMonth, onMonthChange }: MonthSelectorProps) {
  const [year, month] = currentMonth.split("-").map(Number);

  const handlePrev = () => {
    let newYear = year;
    let newMonth = month - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    const formatted = `${newYear}-${String(newMonth).padStart(2, "0")}`;
    onMonthChange(formatted);
  };

  const handleNext = () => {
    let newYear = year;
    let newMonth = month + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    const formatted = `${newYear}-${String(newMonth).padStart(2, "0")}`;
    onMonthChange(formatted);
  };

  return (
    <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200/80 p-2 shadow-xs">
      <button
        type="button"
        onClick={handlePrev}
        aria-label="Tháng trước"
        className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/70 transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-indigo-600" />
        <label className="relative cursor-pointer">
          <span className="text-sm font-bold text-slate-900">
            Tháng {String(month).padStart(2, "0")}/{year}
          </span>
          <input
            type="month"
            value={currentMonth}
            onChange={(e) => {
              if (e.target.value) onMonthChange(e.target.value);
            }}
            className="absolute inset-0 opacity-0 cursor-pointer w-full"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={handleNext}
        aria-label="Tháng sau"
        className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/70 transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
