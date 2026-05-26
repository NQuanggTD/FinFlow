// src/components/dashboard/DashboardShell.tsx
"use client";

import { useState }           from "react";
import { SummaryCards }       from "@/components/dashboard/SummaryCards";
import { CashFlowChart }      from "@/components/charts/CashFlowChart";
import { CategoryPieChart }   from "@/components/charts/CategoryPieChart";
// CompareChart component was removed or relocated; use a simple placeholder
// until the component is available at the expected path.
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { BudgetOverview }     from "@/components/dashboard/BudgetOverview";
import { FlowScoreCard }      from "@/components/dashboard/FlowScoreCard";
import { OnboardingBanner }   from "@/components/dashboard/OnboardingBanner";
import { useTransactions, useDashboardSummary } from "@/hooks/useTransactions";
import { useTotalBalance }    from "@/hooks/useAccounts";
import { useRealtimeAll }     from "@/hooks/useSupabaseRealtime";
import { CardSkeleton }       from "@/components/ui/Skeleton";
import Link                   from "next/link";
import { cn }                 from "@/lib/utils/cn";

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
  "", "Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6",
  "Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12",
];
const NOW      = new Date();
const CUR_YEAR = NOW.getFullYear();
const YEARS    = Array.from({ length: CUR_YEAR - 2022 }, (_, i) => 2023 + i);

// ─── Props ────────────────────────────────────────────────────────────────────

interface ShellProps {
  userId:          string;
  flowScore:       number;
  hasAccounts?:    boolean;
  hasTransactions?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DashboardShell({
  userId,
  flowScore,
  hasAccounts    = true,
  hasTransactions = true,
}: ShellProps) {
  const [month, setMonth] = useState(NOW.getMonth() + 1);
  const [year,  setYear ] = useState(NOW.getFullYear());

  // ── Realtime ──────────────────────────────────────────────────────────
  useRealtimeAll(userId);

  // ── Data ──────────────────────────────────────────────────────────────
  const { data: transactions, isLoading } = useTransactions(month, year);
  const { data: summary }                  = useDashboardSummary(month, year);
  const totalBalance                       = useTotalBalance();

  const isCurrentMonth =
    month === NOW.getMonth() + 1 && year === NOW.getFullYear();

  return (
    <div className="space-y-6">
      {/* ── Onboarding ── */}
      <OnboardingBanner
        hasAccounts={hasAccounts}
        hasTransactions={hasTransactions}
      />

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

          {/* Month / Year picker */}
          <div className="flex items-center gap-2 mt-1">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-600 bg-white"
            >
              {MONTHS.slice(1).map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>

            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-600 bg-white"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            {!isCurrentMonth && (
              <button
                onClick={() => {
                  setMonth(NOW.getMonth() + 1);
                  setYear(NOW.getFullYear());
                }}
                className="text-xs text-indigo-600 hover:underline font-medium"
              >
                Tháng hiện tại
              </button>
            )}

            {/* Live indicator */}
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 ml-1"
              title="Dữ liệu cập nhật thời gian thực"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span className="text-[10px] font-medium text-emerald-600">Live</span>
            </div>
          </div>
        </div>

        {/* Quick-add */}
        <Link
          href="/transactions/new"
          className={cn(
            "inline-flex items-center gap-1.5 px-4 py-2",
            "bg-indigo-600 text-white rounded-xl text-sm font-semibold",
            "hover:bg-indigo-700 active:scale-95 transition-all shadow-sm shadow-indigo-200",
          )}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Thêm giao dịch
        </Link>
      </div>

      {/* ── Summary cards ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <SummaryCards
          totalBalance={totalBalance}
          monthlyIncome={summary?.monthlyIncome   ?? 0}
          monthlyExpense={summary?.monthlyExpense ?? 0}
          monthlySaving={summary?.monthlySaving   ?? 0}
          savingRate={summary?.savingRate          ?? 0}
        />
      )}

      {/* ── Row 1: CashFlow (daily-by-weekday) + FlowScore ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CashFlowChart month={month} year={year} />
        </div>
        <FlowScoreCard score={flowScore} />
      </div>

      {/* ── Row 2: Compare chart (full width) ── */}
      <div className="w-full rounded-lg border border-gray-100 bg-white p-4">
        <h2 className="text-sm font-medium text-gray-700">So sánh</h2>
        <p className="mt-2 text-sm text-gray-500">Biểu đồ so sánh tạm thời không khả dụng.</p>
      </div>

      {/* ── Row 3: Category pie + Budget ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryPieChart transactions={transactions ?? []} />
        <BudgetOverview month={month} year={year} />
      </div>

      {/* ── Recent transactions ── */}
      <RecentTransactions transactions={(transactions ?? []).slice(0, 6)} />
    </div>
  );
}