"use client";

import { formatCurrency } from "@/lib/utils/format";
import type { DashboardSummary } from "@/types";

export function SummaryCards({
  totalBalance, monthlyIncome, monthlyExpense, monthlySaving, savingRate,
}: DashboardSummary) {
  const cards = [
    {
      label: "Tổng số dư",
      value: totalBalance,
      icon: "💰",
      bg: "bg-indigo-600",
      sub: "Tất cả tài khoản",
      highlight: false,
    },
    {
      label: "Thu nhập tháng",
      value: monthlyIncome,
      icon: "📈",
      bg: "bg-green-600",
      sub: "Tháng này",
      highlight: false,
    },
    {
      label: "Chi tiêu tháng",
      value: monthlyExpense,
      icon: "📉",
      bg: "bg-red-500",
      sub: "Tháng này",
      highlight: false,
    },
    {
      label: "Tiết kiệm",
      value: monthlySaving,
      icon: monthlySaving >= 0 ? "⭐" : "⚠️",
      bg: monthlySaving >= 0 ? "bg-amber-500" : "bg-orange-500",
      sub: `Tỷ lệ ${savingRate.toFixed(1)}%`,
      highlight: monthlySaving < 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`bg-white rounded-xl p-5 shadow-sm border transition-shadow hover:shadow-md ${
            c.highlight ? "border-orange-200" : "border-gray-100"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-500 text-sm font-medium">{c.label}</span>
            <span className={`${c.bg} text-white rounded-lg w-9 h-9 flex items-center justify-center text-base`}>
              {c.icon}
            </span>
          </div>
          <p className={`text-xl font-bold ${c.value < 0 ? "text-red-600" : "text-gray-900"}`}>
            {formatCurrency(c.value)}
          </p>
          <p className={`text-xs mt-1 ${c.highlight ? "text-orange-500 font-medium" : "text-gray-400"}`}>
            {c.sub}
          </p>
        </div>
      ))}
    </div>
  );
}
