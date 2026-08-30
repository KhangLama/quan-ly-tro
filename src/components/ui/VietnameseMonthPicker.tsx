"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface VietnameseMonthPickerProps {
  value: string; // Format: "YYYY-MM" (e.g. "2026-08")
  onChange: (newMonth: string) => void;
  className?: string;
  showQuickNav?: boolean;
}

const MONTHS = [
  { value: 1, label: "Tháng 01" },
  { value: 2, label: "Tháng 02" },
  { value: 3, label: "Tháng 03" },
  { value: 4, label: "Tháng 04" },
  { value: 5, label: "Tháng 05" },
  { value: 6, label: "Tháng 06" },
  { value: 7, label: "Tháng 07" },
  { value: 8, label: "Tháng 08" },
  { value: 9, label: "Tháng 09" },
  { value: 10, label: "Tháng 10" },
  { value: 11, label: "Tháng 11" },
  { value: 12, label: "Tháng 12" },
];

export function VietnameseMonthPicker({
  value,
  onChange,
  className = "",
  showQuickNav = true,
}: VietnameseMonthPickerProps) {
  const currentYear = new Date().getFullYear();
  const [yearStr, monthStr] = (value || `${currentYear}-08`).split("-");
  const year = parseInt(yearStr, 10) || currentYear;
  const month = parseInt(monthStr, 10) || (new Date().getMonth() + 1);

  // Years list: current year - 2 to current year + 2 (e.g. 2024, 2025, 2026, 2027, 2028)
  const years = [
    currentYear - 2,
    currentYear - 1,
    currentYear,
    currentYear + 1,
    currentYear + 2,
  ];

  const handleMonthChange = (newMonthNum: number) => {
    const formatted = `${year}-${String(newMonthNum).padStart(2, "0")}`;
    onChange(formatted);
  };

  const handleYearChange = (newYearNum: number) => {
    const formatted = `${newYearNum}-${String(month).padStart(2, "0")}`;
    onChange(formatted);
  };

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
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {showQuickNav && (
        <button
          type="button"
          onClick={handlePrevMonth}
          title="Tháng trước"
          aria-label="Tháng trước"
          className="h-9 w-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200/80 shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {/* 2 Compact Vietnamese Dropdowns: [Tháng] [Năm] */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1 shadow-xs">
        <Calendar className="w-3.5 h-3.5 text-indigo-600 mr-1 shrink-0" />

        {/* Month Selector (Only 12 items) */}
        <select
          value={month}
          onChange={(e) => handleMonthChange(parseInt(e.target.value, 10))}
          aria-label="Chọn tháng"
          className="bg-transparent text-xs font-extrabold text-slate-900 cursor-pointer focus:outline-hidden py-1"
        >
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value} className="text-slate-900 font-bold">
              {m.label}
            </option>
          ))}
        </select>

        <span className="text-slate-300 font-bold">/</span>

        {/* Year Selector (Only 5 years) */}
        <select
          value={year}
          onChange={(e) => handleYearChange(parseInt(e.target.value, 10))}
          aria-label="Chọn năm"
          className="bg-transparent text-xs font-extrabold text-slate-900 cursor-pointer focus:outline-hidden py-1"
        >
          {years.map((y) => (
            <option key={y} value={y} className="text-slate-900 font-bold">
              {y}
            </option>
          ))}
        </select>
      </div>

      {showQuickNav && (
        <button
          type="button"
          onClick={handleNextMonth}
          title="Tháng tiếp theo"
          aria-label="Tháng tiếp theo"
          className="h-9 w-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200/80 shrink-0"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
