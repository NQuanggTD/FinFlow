"use client";

import { useState }           from "react";
import { SummaryCards }       from "@/components/dashboard/SummaryCards";
import { CashFlowChart }      from "@/components/charts/CashFlowChart";
import { CategoryPieChart }   from "@/components/charts/CategoryPieChart";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { BudgetOverview }     from "@/components/dashboard/BudgetOverview";
import { FlowScoreCard }      from "@/components/dashboard/FlowScoreCard";
import { useTransactions, useDashboardSummary } from "@/hooks/useTransactions";
import { useTotalBalance }    from "@/hooks/useAccounts";
import { useRealtimeAll } from "@/hooks/useSupabaseRealtime";
import { CardSkeleton }       from "@/components/ui/Skeleton";
import { OnboardingBanner } from "@/components/dashboard/OnboardingBanner";
import Link                   from "next/link";
import { cn }                 from "@/lib/utils/cn";

const MONTHS = ["","Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6",
  "Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];
const NOW = new Date();
const CUR_YEAR = NOW.getFullYear();
const YEARS = Array.from({ length: CUR_YEAR - 2022 }, (_, i) => 2023 + i);

interface ShellProps { userId: string; flowScore: number; hasAccounts?: boolean; hasTransactions?: boolean; }
export function DashboardShell({ userId, flowScore, hasAccounts = true, hasTransactions = true }: ShellProps) {
  const [month, setMonth] = useState(NOW.getMonth() + 1);
  const [year,  setYear ] = useState(NOW.getFullYear());

  useRealtimeAll(userId);

  const { data: transactions, isLoading, isFetching } = useTransactions(month, year);
  const { data: summary, isFetching: summaryFetching } = useDashboardSummary(month, year);
  const loading = isLoading; // Only skeleton on initial load, not background refetch
  const totalBalance                      = useTotalBalance();

  return (
    <div className="space-y-6">
      {/* Onboarding */}
      <OnboardingBanner hasAccounts={hasAccounts} hasTransactions={hasTransactions} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
            {/* Month / Year selector */}
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-600 bg-white">
              {MONTHS.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
            <select value={year} onChange={(e) => setYear(Number(e.target.value))}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-600 bg-white">
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            {(month !== NOW.getMonth() + 1 || year !== NOW.getFullYear()) && (
              <button onClick={() => { setMonth(NOW.getMonth() + 1); setYear(NOW.getFullYear()); }}
                className="text-xs text-indigo-600 hover:underline">Tháng hiện tại</button>
            )}
          </div>
        </div>
        <Link href="/transactions/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
          ＋ Thêm giao dịch
        </Link>
      </div>

      {/* Summary cards */}
      {loading
        ? <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i=><CardSkeleton key={i}/>)}</div>
        : <SummaryCards
            totalBalance={totalBalance}
            monthlyIncome={summary?.monthlyIncome ?? 0}
            monthlyExpense={summary?.monthlyExpense ?? 0}
            monthlySaving={summary?.monthlySaving ?? 0}
            savingRate={summary?.savingRate ?? 0}
          />
      }

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><CashFlowChart month={month} year={year} /></div>
        <FlowScoreCard score={flowScore} />
      </div>

      {/* Secondary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryPieChart transactions={transactions ?? []} />
        <BudgetOverview month={month} year={year} />
      </div>

      {/* Recent */}
      <RecentTransactions transactions={(transactions ?? []).slice(0, 6)} />
    </div>
  );
}
