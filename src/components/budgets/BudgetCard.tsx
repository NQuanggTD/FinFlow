"use client";

import { useState }             from "react";
import { formatCurrency }       from "@/lib/utils/format";
import { ProgressBar }          from "@/components/ui/ProgressBar";
import { Badge }                from "@/components/ui/Badge";
import { useToast }             from "@/components/ui/Toast";
import { deleteBudgetAction }   from "@/actions/budgets";
import type { BudgetWithUsage } from "@/types";

export function BudgetCard({ budget: b, onDeleted }: { budget: BudgetWithUsage; onDeleted?: () => void }) {
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const status      = b.percentage >= 100 ? "Vượt hạn mức" : b.percentage >= b.alert_at_percent ? "Sắp hết" : "Bình thường";
  const statusColor = b.percentage >= 100 ? "red" : b.percentage >= b.alert_at_percent ? "amber" : "green";

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Xóa ngân sách danh mục "${b.category_name}"?`)) return;
    setDeleting(true);
    const res = await deleteBudgetAction(b.id);
    setDeleting(false);
    if ("error" in res) toast(res.error ?? "Lỗi xóa ngân sách", "error");
    else { toast("Đã xóa ngân sách", "success"); onDeleted?.(); }
  }

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group relative">
      {/* Delete button */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
        title="Xóa ngân sách"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>

      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4 pr-6">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
          style={{ backgroundColor: b.category_color + "22" }}
        >
          {b.category_icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{b.category_name}</p>
          <Badge label={status} color={statusColor} dot />
        </div>
      </div>

      {/* Progress */}
      <ProgressBar value={b.percentage} size="md" />

      {/* Numbers */}
      <div className="mt-3 flex justify-between text-xs text-gray-500">
        <span>Đã dùng: <strong className="text-gray-800">{formatCurrency(b.spent)}</strong></span>
        <span>
          Còn lại:{" "}
          <strong className={b.remaining < 0 ? "text-red-600" : "text-green-600"}>
            {formatCurrency(Math.abs(b.remaining))}{b.remaining < 0 ? " (vượt)" : ""}
          </strong>
        </span>
      </div>
      <p className="mt-1 text-xs text-gray-400 text-right">Tổng: {formatCurrency(b.amount_limit)}</p>

      {/* Alerts */}
      {b.percentage >= 100 && (
        <div className="mt-3 p-2.5 bg-red-50 rounded-lg border border-red-100 text-xs text-red-600 flex items-center gap-1.5">
          🚨 Đã vượt {formatCurrency(Math.abs(b.remaining))}!
        </div>
      )}
      {b.percentage >= b.alert_at_percent && b.percentage < 100 && (
        <div className="mt-3 p-2.5 bg-amber-50 rounded-lg border border-amber-100 text-xs text-amber-700 flex items-center gap-1.5">
          ⚠️ Đã dùng {b.percentage.toFixed(0)}% — chú ý chi tiêu!
        </div>
      )}
    </div>
  );
}
