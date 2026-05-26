"use client";

import { useBudgetsWithUsage } from "@/hooks/useBudgets";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export function BudgetOverview({ month, year }: { month: number; year: number }) {
  const { data: budgets, isLoading } = useBudgetsWithUsage(month, year);

  if (isLoading) return <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse h-64" />;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="font-semibold text-gray-900 mb-4">Tình trạng ngân sách</h3>
      {!budgets?.length ? (
        <p className="text-center text-gray-400 py-8 text-sm">Chưa thiết lập ngân sách</p>
      ) : (
        <div className="space-y-4">
          {budgets.map((b) => (
            <div key={b.id}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">{b.category_icon} {b.category_name}</span>
                <span className={cn("text-xs", b.percentage >= 100 ? "text-red-600 font-bold" : b.percentage >= 80 ? "text-amber-500" : "text-gray-500")}>
                  {formatCurrency(b.spent)} / {formatCurrency(b.amount_limit)}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={cn("h-2 rounded-full transition-all", b.percentage >= 100 ? "bg-red-500" : b.percentage >= 80 ? "bg-amber-400" : "bg-indigo-500")}
                  style={{ width: `${Math.min(b.percentage, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
