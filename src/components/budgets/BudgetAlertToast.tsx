"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { BudgetAlert } from "@/types/budget";

interface Props {
  alert: BudgetAlert;
  onClose: () => void;
}

export function BudgetAlertToast({ alert, onClose }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 8000);
    return () => clearTimeout(timer);
  }, [onClose]);

  function dismiss() {
    setVisible(false);
    setTimeout(onClose, 300);
  }

  const exceeded = alert.isExceeded;
  const pct = Math.min(alert.percentage, 100);

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-200 w-80 rounded-2xl shadow-2xl border transition-all duration-300",
        exceeded
          ? "bg-rose-50 border-rose-200"
          : "bg-amber-50 border-amber-200",
        visible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-4 scale-95",
      )}
      role="alert"
    >
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-3 rounded-t-2xl",
          exceeded ? "bg-rose-100" : "bg-amber-100",
        )}
      >
        <span className="text-xl">{exceeded ? "🚨" : "⚠️"}</span>
        <p
          className={cn(
            "flex-1 font-bold text-sm",
            exceeded ? "text-rose-700" : "text-amber-700",
          )}
        >
          {exceeded ? "Vượt hạn mức ngân sách!" : "Sắp đạt hạn mức ngân sách"}
        </p>
        <button
          onClick={dismiss}
          className={cn(
            "p-1 rounded-lg transition-colors text-sm",
            exceeded
              ? "text-rose-400 hover:text-rose-600 hover:bg-rose-200"
              : "text-amber-400 hover:text-amber-600 hover:bg-amber-200",
          )}
          aria-label="Đóng"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="px-4 py-3 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{alert.categoryIcon}</span>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {alert.categoryName}
            </p>
            <p className="text-xs text-gray-500">
              Đã chi {formatCurrency(alert.spent)} /{" "}
              {formatCurrency(alert.limit)}
            </p>
          </div>
          <span
            className={cn(
              "ml-auto text-lg font-extrabold",
              exceeded ? "text-rose-600" : "text-amber-600",
            )}
          >
            {alert.percentage}%
          </span>
        </div>

        <div className="space-y-1">
          <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                exceeded ? "bg-rose-500" : "bg-amber-400",
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          {!exceeded && (
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>Ngưỡng cảnh báo: {alert.alertPercent}%</span>
              <span>Còn lại: {formatCurrency(alert.limit - alert.spent)}</span>
            </div>
          )}
          {exceeded && (
            <p className="text-xs font-semibold text-rose-600 text-center">
              Vượt {formatCurrency(alert.spent - alert.limit)}
            </p>
          )}
        </div>

        <Link
          href="/budgets"
          onClick={dismiss}
          className={cn(
            "flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-semibold transition-colors",
            exceeded
              ? "bg-rose-500 hover:bg-rose-600 text-white"
              : "bg-amber-400 hover:bg-amber-500 text-white",
          )}
        >
          Xem trang ngân sách
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}
