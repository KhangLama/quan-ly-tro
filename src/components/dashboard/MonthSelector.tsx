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

  // Generate list of 36 months for dropdown
  const monthOptions = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    const currentMonthNum = new Date().getMonth() + 1;
    const currentYm = `${currentYear}-${String(currentMonthNum).padStart(2, "0")}`;

    const options: { value: string; label: string }[] = [];
    for (let y = currentYear + 1; y >= currentYear - 3; y--) {
      for (let m = 12; m >= 1; m--) {
        const val = `${y}-${String(m).padStart(2, "0")}`;
        const isCur = val === currentYm;
        options.push({
          value: val,
          label: `Tháng ${String(m).padStart(2, "0")}/${y}${isCur ? " (Hiện tại)" : ""}`,
        });
      }
    }
    return options;
  }, []);

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

      <div className="relative flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
        <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
        <select
          value={currentMonth}
          onChange={(e) => {
            if (e.target.value) onMonthChange(e.target.value);
          }}
          aria-label="Chọn tháng thống kê"
          className="bg-transparent text-sm font-bold text-slate-900 cursor-pointer focus:outline-hidden appearance-none pr-4"
        >
          {monthOptions.map((opt) => (
            <option key={opt.value} value={opt.value} className="text-slate-900 font-medium">
              {opt.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-1 text-[10px] text-slate-400">
          ▼
        </span>
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
