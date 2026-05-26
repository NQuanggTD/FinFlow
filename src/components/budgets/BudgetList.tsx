"use client";

import { useState }         from "react";
import { useBudgetsWithUsage } from "@/hooks/useBudgets";
import { BudgetCard }       from "./BudgetCard";
import { BudgetFormModal }  from "./BudgetFormModal";
import { EmptyState }       from "@/components/ui/EmptyState";
import { CardSkeleton }     from "@/components/ui/Skeleton";
import { Button }           from "@/components/ui/Button";
import { formatCurrency }   from "@/lib/utils/format";

const NOW_YEAR = new Date().getFullYear();
const YEARS_RANGE = Array.from({ length: NOW_YEAR - 2022 }, (_, i) => 2023 + i);

const MONTHS = ["","Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];

export function BudgetList({ month: initM, year: initY }: { month: number; year: number }) {
  const [currentMonth, setCurrentMonth] = useState(initM);
  const [currentYear,  setCurrentYear ] = useState(initY);
  const [showForm,     setShowForm    ] = useState(false);

  const { data: budgets, isLoading, refetch } = useBudgetsWithUsage(currentMonth, currentYear);

  const totalLimit  = budgets?.reduce((s, b) => s + b.amount_limit, 0) ?? 0;
  const totalSpent  = budgets?.reduce((s, b) => s + b.spent, 0) ?? 0;
  const overCount   = budgets?.filter((b) => b.percentage >= 100).length ?? 0;
  const warnCount   = budgets?.filter((b) => b.percentage >= b.alert_at_percent && b.percentage < 100).length ?? 0;

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <select value={currentMonth} onChange={(e) => setCurrentMonth(Number(e.target.value))}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700">
          {MONTHS.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <select value={currentYear} onChange={(e) => setCurrentYear(Number(e.target.value))}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700">
          {YEARS_RANGE.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <div className="flex-1" />
        <Button size="sm" onClick={() => setShowForm(true)}>＋ Thêm ngân sách</Button>
      </div>

      {/* Stats */}
      {!isLoading && (budgets?.length ?? 0) > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Tổng hạn mức", val: formatCurrency(totalLimit),                       icon: "🎯", cls: "bg-indigo-50 border-indigo-100 text-indigo-800" },
            { label: "Đã chi tiêu",  val: formatCurrency(totalSpent),                       icon: "📊", cls: "bg-amber-50  border-amber-100  text-amber-800"  },
            { label: "Còn lại",      val: formatCurrency(Math.max(totalLimit-totalSpent,0)), icon: "💰", cls: "bg-green-50  border-green-100  text-green-800"  },
            { label: "Vượt hạn mức", val: `${overCount} danh mục`, icon: overCount > 0 ? "🚨" : "✅",
              cls: overCount > 0 ? "bg-red-50 border-red-100 text-red-700" : "bg-green-50 border-green-100 text-green-700" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl p-4 border ${s.cls}`}>
              <p className="text-xs font-medium opacity-70">{s.label}</p>
              <p className="text-base font-bold mt-1">{s.icon} {s.val}</p>
            </div>
          ))}
        </div>
      )}

      {warnCount > 0 && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          ⚠️ {warnCount} danh mục đang tiến gần giới hạn ngân sách.
        </div>
      )}

      {/* Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : (budgets?.length ?? 0) === 0 ? (
        <EmptyState icon="🎯" title="Chưa có ngân sách nào"
          description={`Thiết lập ngân sách cho ${MONTHS[currentMonth]}/${currentYear} để kiểm soát chi tiêu.`}
          actionLabel="＋ Tạo ngân sách đầu tiên" onAction={() => setShowForm(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets?.map((b) => (
            <BudgetCard key={b.id} budget={b} onDeleted={() => void refetch()} />
          ))}
        </div>
      )}

      <BudgetFormModal open={showForm} onClose={() => setShowForm(false)}
        onSuccess={() => { setShowForm(false); void refetch(); }}
        month={currentMonth} year={currentYear} />
    </div>
  );
}
