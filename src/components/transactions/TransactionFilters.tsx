"use client";

import { cn } from "@/lib/utils/cn";

interface Props {
  month: number; year: number;
  onMonthChange: (m: number) => void;
  onYearChange:  (y: number) => void;
  filterType:    "all" | "income" | "expense";
  onFilterType:  (f: "all" | "income" | "expense") => void;
  searchQuery:   string;
  onSearch:      (q: string) => void;
}

const MONTHS = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];
const TYPES  = [
  { value: "all"     as const, label: "Tất cả"   },
  { value: "income"  as const, label: "Thu nhập" },
  { value: "expense" as const, label: "Chi tiêu" },
];

// Dynamic years: from 2023 to current year
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 2022 }, (_, i) => 2023 + i);

export function TransactionFilters({ month, year, onMonthChange, onYearChange, filterType, onFilterType, searchQuery, onSearch }: Props) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Month */}
        <select value={month} onChange={(e) => onMonthChange(Number(e.target.value))}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 bg-white">
          {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>

        {/* Year - dynamic */}
        <select value={year} onChange={(e) => onYearChange(Number(e.target.value))}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 bg-white">
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>

        {/* Type filter */}
        <div className="flex border border-gray-200 rounded-lg overflow-hidden">
          {TYPES.map((t) => (
            <button key={t.value} onClick={() => onFilterType(t.value)}
              className={cn("px-3 py-2 text-sm font-medium transition-colors",
                filterType === t.value ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50")}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
          <input
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Tìm danh mục, ghi chú..."
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 placeholder:text-gray-400"
          />
          {searchQuery && (
            <button onClick={() => onSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 text-xs">
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
