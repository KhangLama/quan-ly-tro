"use client";

import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface VietnameseMonthPickerProps {
  value: string; // e.g. "2026-08"
  onChange: (newMonth: string) => void;
  className?: string;
  showQuickNav?: boolean;
}

export function VietnameseMonthPicker({
  value,
  onChange,
  className = "",
  showQuickNav = true,
}: VietnameseMonthPickerProps) {
  // Parse year and month
  const [yearStr, monthStr] = (value || new Date().toISOString().substring(0, 7)).split("-");
  const year = parseInt(yearStr, 10) || new Date().getFullYear();
  const month = parseInt(monthStr, 10) || new Date().getMonth() + 1;

  // Generate options for the current year +/- 2 years (60 months total)
  const monthOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const currentMonthNum = new Date().getMonth() + 1;
    const currentYm = `${currentYear}-${String(currentMonthNum).padStart(2, "0")}`;
    
    const options: { value: string; label: string; isCurrent: boolean }[] = [];
    
    for (let y = currentYear + 1; y >= currentYear - 3; y--) {
      for (let m = 12; m >= 1; m--) {
        const val = `${y}-${String(m).padStart(2, "0")}`;
        const isCurrent = val === currentYm;
        options.push({
          value: val,
          label: `Tháng ${String(m).padStart(2, "0")}/${y}${isCurrent ? " (Hiện tại)" : ""}`,
          isCurrent,
        });
      }
    }
    return options;
  }, []);

  const handlePrevMonth = () => {
    let newM = month - 1;
    let newY = year;
    if (newM < 1) {
      newM = 12;
      newY -= 1;
    }
    onChange(`${newY}-${String(newM).padStart(2, "0")}`);
  };

  const handleNextMonth = () => {
    let newM = month + 1;
    let newY = year;
    if (newM > 12) {
      newM = 1;
      newY += 1;
    }
    onChange(`${newY}-${String(newM).padStart(2, "0")}`);
  };

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      {showQuickNav && (
        <button
          type="button"
          onClick={handlePrevMonth}
          title="Tháng trước"
          aria-label="Tháng trước"
          className="h-9 w-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200/80"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      <div className="relative flex items-center bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-xs focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
        <Calendar className="w-3.5 h-3.5 text-indigo-600 mr-1.5 shrink-0" />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Chọn tháng năm"
          className="bg-transparent text-xs font-bold text-slate-800 pr-5 appearance-none cursor-pointer focus:outline-hidden"
        >
          {monthOptions.map((opt) => (
            <option key={opt.value} value={opt.value} className="text-slate-900 font-medium">
              {opt.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2 text-[10px] text-slate-400">
          ▼
        </span>
      </div>

      {showQuickNav && (
        <button
          type="button"
          onClick={handleNextMonth}
          title="Tháng tiếp theo"
          aria-label="Tháng tiếp theo"
          className="h-9 w-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200/80"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
