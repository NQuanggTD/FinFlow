"use client";

import Link from "next/link";
import { useBudgetsWithUsage } from "@/hooks/useBudgets";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export function BudgetOverview({
  month,
  year,
}: {
  month: number;
  year: number;
}) {
  const { data: budgets, isLoading } = useBudgetsWithUsage(month, year);

  if (isLoading)
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse h-64" />
    );

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Tình trạng ngân sách</h3>
        <Link
          href="/budgets"
          className="text-xs text-indigo-600 font-medium hover:underline"
        >
          Xem tất cả →
        </Link>
      </div>
      {budgets?.some((b) => b.percentage >= 100) && (
        <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
          <span className="animate-pulse">🚨</span>
          <span>
            {budgets.filter((b) => b.percentage >= 100).length} danh mục đã vượt
            hạn mức:{" "}
            {budgets
              .filter((b) => b.percentage >= 100)
              .map((b) => `${b.category_icon} ${b.category_name}`)
              .join(", ")}
          </span>
        </div>
      )}
      {budgets?.some(
        (b) => b.percentage >= b.alert_at_percent && b.percentage < 100,
      ) &&
        !budgets?.some((b) => b.percentage >= 100) && (
          <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-medium">
            <span>⚠️</span>
            <span>
              {
                budgets.filter(
                  (b) =>
                    b.percentage >= b.alert_at_percent && b.percentage < 100,
                ).length
              }{" "}
              danh mục sắp đạt ngưỡng cảnh báo
            </span>
          </div>
        )}
      {!budgets?.length ? (
        <div className="flex flex-col items-center py-8 gap-2 text-center">
          <span className="text-3xl">🎯</span>
          <p className="text-sm text-gray-400">Chưa thiết lập ngân sách</p>
          <Link
            href="/budgets"
            className="text-xs text-indigo-600 font-medium hover:underline"
          >
            Thiết lập ngay →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {budgets.map((b) => {
            const isOver = b.percentage >= 100;
            const isNear = b.percentage >= b.alert_at_percent && !isOver;

            return (
              <div key={b.id}>
                <div className="flex justify-between text-sm mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span>{b.category_icon}</span>
                    <span className="font-medium text-gray-800">
                      {b.category_name}
                    </span>
                    {isOver && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                      </span>
                    )}
                    {isNear && !isOver && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      isOver
                        ? "text-rose-600"
                        : isNear
                          ? "text-amber-500"
                          : "text-gray-400",
                    )}
                  >
                    {formatCurrency(b.spent)} / {formatCurrency(b.amount_limit)}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all duration-500",
                      isOver
                        ? "bg-rose-500"
                        : isNear
                          ? "bg-amber-400"
                          : "bg-indigo-500",
                    )}
                    style={{ width: `${Math.min(b.percentage, 100)}%` }}
                  />
                </div>
                {isOver && (
                  <p className="text-[10px] text-rose-600 font-semibold mt-0.5 text-right">
                    Vượt {formatCurrency(Math.abs(b.remaining))}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
