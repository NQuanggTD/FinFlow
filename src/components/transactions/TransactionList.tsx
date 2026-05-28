"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useTransactions,
  type TransactionWithRelations,
} from "@/hooks/useTransactions";
import { useRealtimeTransactions } from "@/hooks/useSupabaseRealtime";
import { TransactionItem } from "./TransactionItem";
import { TransactionFilters } from "./TransactionFilters";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { formatDate, formatCurrency } from "@/lib/utils/format";
import { createClient } from "@/lib/supabase/client";

interface Props {
  initialData: TransactionWithRelations[];
  month: number;
  year: number;
}

const PAGE_SIZE = 20;

export function TransactionList({ initialData, month, year }: Props) {
  const [currentMonth, setCurrentMonth] = useState(month);
  const [currentYear, setCurrentYear] = useState(year);
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [userId, setUserId] = useState("");
  const [page, setPage] = useState(1);
  const router = useRouter();

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (data.user) setUserId(data.user.id);
      });
  }, []);

  // Reset page when filters change (defer to avoid synchronous setState in effect)
  useEffect(() => {
    const t = window.setTimeout(() => setPage(1), 0);
    return () => clearTimeout(t);
  }, [currentMonth, currentYear, filterType, searchQuery]);

  useRealtimeTransactions(userId);

  const { data: fetched, isLoading } = useTransactions(
    currentMonth,
    currentYear,
  );
  const list = fetched ?? initialData;

  const filtered = list.filter((t) => {
    if (filterType !== "all" && t.type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.categories?.name?.toLowerCase().includes(q) === true ||
        t.note?.toLowerCase().includes(q) === true ||
        t.accounts?.name?.toLowerCase().includes(q) === true
      );
    }
    return true;
  });

  // Group by date (paginated)
  const paginated = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = filtered.length > page * PAGE_SIZE;

  const grouped = paginated.reduce<Record<string, TransactionWithRelations[]>>(
    (acc, t) => {
      if (!acc[t.date]) acc[t.date] = [];
      acc[t.date].push(t);
      return acc;
    },
    {},
  );

  const totalIncome = filtered
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-4">
      <TransactionFilters
        month={currentMonth}
        year={currentYear}
        onMonthChange={setCurrentMonth}
        onYearChange={setCurrentYear}
        filterType={filterType}
        onFilterType={setFilterType}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
      />

      {isLoading ? (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <TableSkeleton rows={8} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="💳"
          title="Không có giao dịch"
          description={
            searchQuery
              ? "Không tìm thấy giao dịch phù hợp. Thử từ khoá khác."
              : `Chưa có giao dịch nào trong tháng ${currentMonth}/${currentYear}.`
          }
          actionLabel="＋ Thêm giao dịch"
          onAction={() => router.push("/transactions/new")}
        />
      ) : (
        <>
          {/* Grouped list */}
          <div className="space-y-4">
            {Object.entries(grouped)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([date, txs]) => {
                const dayIncome = txs
                  .filter((t) => t.type === "income")
                  .reduce((s, t) => s + t.amount, 0);
                const dayExpense = txs
                  .filter((t) => t.type === "expense")
                  .reduce((s, t) => s + t.amount, 0);
                return (
                  <div
                    key={date}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                  >
                    <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">
                        {formatDate(date, "EEEE, dd/MM/yyyy")}
                      </span>
                      <div className="flex gap-3 text-xs">
                        {dayIncome > 0 && (
                          <span className="text-green-600 font-semibold">
                            +{formatCurrency(dayIncome)}
                          </span>
                        )}
                        {dayExpense > 0 && (
                          <span className="text-red-500 font-semibold">
                            −{formatCurrency(dayExpense)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {txs.map((t) => (
                        <TransactionItem key={t.id} transaction={t} />
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Load more */}
          {hasMore && (
            <button
              onClick={() => setPage((p) => p + 1)}
              className="w-full py-3 text-sm text-indigo-600 font-medium hover:bg-indigo-50 rounded-xl border border-indigo-100 transition-colors"
            >
              Xem thêm ({filtered.length - page * PAGE_SIZE} giao dịch còn lại)
            </button>
          )}

          {/* Summary */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between text-sm">
            <span className="text-gray-500">{filtered.length} giao dịch</span>
            <div className="flex gap-4">
              <span className="text-green-600 font-medium">
                Thu: +{formatCurrency(totalIncome)}
              </span>
              <span className="text-red-500  font-medium">
                Chi: −{formatCurrency(totalExpense)}
              </span>
              <span
                className={`font-semibold ${totalIncome - totalExpense >= 0 ? "text-indigo-600" : "text-orange-500"}`}
              >
                Còn: {formatCurrency(totalIncome - totalExpense)}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
