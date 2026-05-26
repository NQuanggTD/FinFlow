// src/components/calendar/CalendarView.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { useTransactions } from "@/hooks/useTransactions";
import { useRealtimeTransactions } from "@/hooks/useSupabaseRealtime";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Props {
  userId: string;
  initialMonth: number;
  initialYear: number;
}

type FilterType = "all" | "income" | "expense";
type ViewMode = "normal" | "heatmap";

// ─── Constants ───────────────────────────────────────────────────────────────

const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTH_NAMES = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Return Tailwind bg class based on ratio 0–1 for heatmap */
function heatBg(ratio: number, direction: "positive" | "negative"): string {
  if (ratio <= 0) return "";

  const palette =
    direction === "positive"
      ? ["bg-sky-50", "bg-sky-100", "bg-sky-200", "bg-sky-300", "bg-sky-400"]
      : [
          "bg-rose-50",
          "bg-rose-100",
          "bg-rose-200",
          "bg-rose-300",
          "bg-rose-400",
        ];

  if (ratio < 0.2) return palette[0];
  if (ratio < 0.4) return palette[1];
  if (ratio < 0.6) return palette[2];
  if (ratio < 0.8) return palette[3];
  return palette[4];
}

/** Export array of transactions as CSV download */
function exportCSV(
  transactions: Array<{
    amount: number;
    type: string;
    date: string;
    note?: string | null;
    categories: { name: string } | null;
    accounts: { name: string } | null;
  }>,
  month: number,
  year: number,
) {
  const header = "Ngày,Loại,Danh mục,Tài khoản,Số tiền,Ghi chú";
  const rows = transactions.map((t) =>
    [
      t.date,
      t.type === "income" ? "Thu nhập" : "Chi tiêu",
      t.categories?.name ?? "Khác",
      t.accounts?.name ?? "",
      t.type === "income" ? t.amount : -t.amount,
      `"${(t.note ?? "").replace(/"/g, '""')}"`,
    ].join(","),
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `finflow_${year}-${String(month).padStart(2, "0")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function CalendarSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="h-4 w-4 bg-gray-200 rounded" />
        <div className="h-5 w-32 bg-gray-200 rounded-full" />
        <div className="h-4 w-4 bg-gray-200 rounded" />
      </div>
      <div className="grid grid-cols-3 gap-px bg-gray-100 border-b border-gray-100">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white px-4 py-3 space-y-1.5">
            <div className="h-3 w-16 bg-gray-100 rounded" />
            <div className="h-4 w-24 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 border-b border-gray-50">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2.5 flex justify-center">
            <div className="h-3 w-4 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, r) => (
        <div key={r} className="grid grid-cols-7">
          {Array.from({ length: 7 }).map((_, c) => (
            <div
              key={c}
              className="h-[88px] border-r border-b border-gray-50/80 p-1.5"
            >
              <div className="w-6 h-6 rounded-full bg-gray-100 mb-1.5" />
              <div className="space-y-1">
                <div className="h-2 w-10 bg-gray-100 rounded" />
                <div className="h-2 w-8  bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Trend Chart ─────────────────────────────────────────────────────────────

interface TrendChartProps {
  daysCount: number;
  month: number;
  year: number;
  dayMap: Record<string, Array<{ amount: number; type: string }>>;
}

function TrendChart({ daysCount, month, year, dayMap }: TrendChartProps) {
  const W = 600;
  const H = 56;
  const BAR_W = Math.floor((W - daysCount * 2) / daysCount);

  const bars = useMemo(() => {
    const result: { income: number; expense: number; day: number }[] = [];
    for (let d = 1; d <= daysCount; d++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const txs = dayMap[dateStr] ?? [];
      result.push({
        day: d,
        income: txs
          .filter((t) => t.type === "income")
          .reduce((s, t) => s + t.amount, 0),
        expense: txs
          .filter((t) => t.type === "expense")
          .reduce((s, t) => s + t.amount, 0),
      });
    }
    return result;
  }, [daysCount, month, year, dayMap]);

  const maxVal = Math.max(...bars.map((b) => Math.max(b.income, b.expense)), 1);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 pt-4 pb-1 flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Biểu đồ chi tiêu hàng ngày
        </p>
        <div className="flex items-center gap-3 text-[11px] text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-emerald-400 inline-block" />
            Thu
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-rose-400   inline-block" />
            Chi
          </span>
        </div>
      </div>
      <div className="px-4 pb-3 overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H + 14}`}
          className="w-full"
          style={{ minWidth: 320 }}
        >
          {bars.map((b, i) => {
            const x = i * (BAR_W + 2);
            const incH = Math.round((b.income / maxVal) * H);
            const expH = Math.round((b.expense / maxVal) * H);
            const hasData = b.income > 0 || b.expense > 0;
            return (
              <g key={b.day}>
                {/* Income bar */}
                {b.income > 0 && (
                  <rect
                    x={x}
                    y={H - incH}
                    width={BAR_W / 2 - 1}
                    height={incH}
                    rx={2}
                    fill="#34d399"
                    opacity={0.8}
                  />
                )}
                {/* Expense bar */}
                {b.expense > 0 && (
                  <rect
                    x={x + BAR_W / 2}
                    y={H - expH}
                    width={BAR_W / 2 - 1}
                    height={expH}
                    rx={2}
                    fill="#fb7185"
                    opacity={0.8}
                  />
                )}
                {/* Day label — only show every 5 days or on edges */}
                {(b.day === 1 || b.day % 5 === 0 || b.day === daysCount) && (
                  <text
                    x={x + BAR_W / 2}
                    y={H + 11}
                    textAnchor="middle"
                    fontSize={8}
                    fill={hasData ? "#9ca3af" : "#d1d5db"}
                  >
                    {b.day}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ─── Day Cell ────────────────────────────────────────────────────────────────

interface DayCellProps {
  day: number;
  dateStr: string;
  income: number;
  expense: number;
  txCount: number;
  icons: (string | null)[];
  isRecurring: boolean;
  isToday: boolean;
  isSunday: boolean;
  isSaturday: boolean;
  isSelected: boolean;
  isFuture: boolean;
  viewMode: ViewMode;
  heatRatio: number;
  heatDirection: "positive" | "negative" | null;
  onClick: () => void;
}

function DayCell({
  day,
  dateStr,
  income,
  expense,
  txCount,
  icons,
  isRecurring,
  isToday,
  isSunday,
  isSaturday,
  isSelected,
  isFuture,
  viewMode,
  heatRatio,
  heatDirection,
  onClick,
}: DayCellProps) {
  const hasTx = txCount > 0;
  const netPositive = income >= expense;

  const bgClass = isSelected
    ? "bg-indigo-50 ring-1 ring-inset ring-indigo-300 z-10"
    : isFuture
      ? "bg-gray-50/30 cursor-default"
      : viewMode === "heatmap" && hasTx
        ? heatDirection
          ? heatBg(heatRatio, heatDirection)
          : "bg-gray-50"
        : "hover:bg-gray-50 active:bg-gray-100";

  return (
    <div
      onClick={onClick}
      className={cn(
        "h-[88px] border-r border-b border-gray-50 p-1.5 transition-all duration-150 select-none relative group",
        !isFuture && "cursor-pointer",
        bgClass,
      )}
    >
      {/* Day number */}
      <div
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold mb-0.5 transition-colors",
          isToday
            ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
            : isSunday
              ? "text-rose-500"
              : isSaturday
                ? "text-sky-500"
                : isFuture
                  ? "text-gray-300"
                  : "text-gray-600 group-hover:text-gray-900",
        )}
      >
        {day}
      </div>

      {/* Recurring badge */}
      {isRecurring && !isFuture && (
        <span
          className="absolute top-1 right-1 text-[9px]"
          title="Có giao dịch định kỳ"
        >
          🔁
        </span>
      )}

      {/* Transaction data */}
      {hasTx && !isFuture && (
        <div className="space-y-0.5">
          {income > 0 && (
            <p className="text-[9px] font-semibold text-emerald-600 leading-tight truncate">
              +{formatCurrency(income).replace(/\s?₫/, "")}
            </p>
          )}
          {expense > 0 && (
            <p className="text-[9px] font-semibold text-rose-500 leading-tight truncate">
              −{formatCurrency(expense).replace(/\s?₫/, "")}
            </p>
          )}
          <div className="flex items-center gap-0.5 flex-wrap mt-0.5">
            {icons.slice(0, 3).map((icon, i) => (
              <span key={i} className="text-[11px] leading-none">
                {icon ?? "💳"}
              </span>
            ))}
            {txCount > 3 && (
              <span className="text-[8px] text-gray-400 font-medium">
                +{txCount - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Quick-add button — appears on hover for non-future, non-selected days */}
      {!isFuture && !isSelected && (
        <Link
          href={`/transactions/new?date=${dateStr}`}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "absolute bottom-1 right-1 w-5 h-5 rounded-full bg-indigo-600 text-white",
            "flex items-center justify-center text-[13px] leading-none font-bold",
            "opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-indigo-700",
          )}
          title={`Thêm giao dịch ${dateStr}`}
        >
          +
        </Link>
      )}

      {/* Net dot */}
      {hasTx && !isFuture && viewMode === "normal" && (
        <div
          className={cn(
            "absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full",
            "group-hover:opacity-0 transition-opacity",
            netPositive ? "bg-emerald-400" : "bg-rose-400",
          )}
        />
      )}
    </div>
  );
}

// ─── Category Breakdown (mini bar chart in detail panel) ─────────────────────

interface CategoryBreakdownProps {
  transactions: Array<{
    amount: number;
    type: string;
    categories: { name: string; icon: string; color?: string } | null;
  }>;
}

function CategoryBreakdown({ transactions }: CategoryBreakdownProps) {
  const byCategory = useMemo(() => {
    const map: Record<
      string,
      { name: string; icon: string; color: string; total: number }
    > = {};
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const key = t.categories?.name ?? "Khác";
        if (!map[key])
          map[key] = {
            name: t.categories?.name ?? "Khác",
            icon: t.categories?.icon ?? "💳",
            color: t.categories?.color ?? "#e5e7eb",
            total: 0,
          };
        map[key].total += t.amount;
      });
    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [transactions]);

  if (byCategory.length === 0) return null;

  const maxTotal = byCategory[0].total;

  return (
    <div className="px-5 py-3 border-t border-gray-50">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
        Phân tích chi tiêu
      </p>
      <div className="space-y-1.5">
        {byCategory.map((c) => (
          <div key={c.name} className="flex items-center gap-2">
            <span className="text-sm flex-shrink-0">{c.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-[11px] text-gray-600 truncate">{c.name}</p>
                <p className="text-[11px] font-semibold text-rose-500 ml-2 flex-shrink-0">
                  {formatCurrency(c.total)}
                </p>
              </div>
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-rose-400 transition-all duration-500"
                  style={{ width: `${(c.total / maxTotal) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Transaction Detail Panel ────────────────────────────────────────────────

interface TxPanelProps {
  dateStr: string;
  transactions: Array<{
    id: string;
    amount: number;
    type: string;
    date: string;
    note?: string | null;
    categories: { name: string; icon: string; color?: string } | null;
    accounts: { name: string } | null;
  }>;
  onClose: () => void;
}

function TxPanel({ dateStr, transactions, onClose }: TxPanelProps) {
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const net = income - expense;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-medium text-indigo-500 uppercase tracking-wider mb-0.5">
              Chi tiết ngày
            </p>
            <h3 className="font-semibold text-gray-900 text-sm">
              {formatDate(dateStr, "EEEE, dd/MM/yyyy")}
            </h3>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {/* Quick-add from panel */}
            <Link
              href={`/transactions/new?date=${dateStr}`}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-[11px] font-semibold hover:bg-indigo-700 transition-colors"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Thêm
            </Link>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Đóng"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mini summary */}
        {transactions.length > 0 && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
            {income > 0 && (
              <div>
                <p className="text-[10px] text-gray-400 mb-0.5">Thu nhập</p>
                <p className="text-sm font-semibold text-emerald-600">
                  +{formatCurrency(income)}
                </p>
              </div>
            )}
            {expense > 0 && (
              <div>
                <p className="text-[10px] text-gray-400 mb-0.5">Chi tiêu</p>
                <p className="text-sm font-semibold text-rose-500">
                  −{formatCurrency(expense)}
                </p>
              </div>
            )}
            {income > 0 && expense > 0 && (
              <div className="ml-auto">
                <p className="text-[10px] text-gray-400 mb-0.5">Số dư ngày</p>
                <p
                  className={cn(
                    "text-sm font-semibold",
                    net >= 0 ? "text-emerald-600" : "text-rose-500",
                  )}
                >
                  {net >= 0 ? "+" : "−"}
                  {formatCurrency(Math.abs(net))}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Transaction list */}
      {transactions.length === 0 ? (
        <div className="py-10 flex flex-col items-center gap-2 text-center">
          <span className="text-3xl">📭</span>
          <p className="text-sm text-gray-400">
            Không có giao dịch vào ngày này
          </p>
          <Link
            href={`/transactions/new?date=${dateStr}`}
            className="mt-1 text-xs text-indigo-600 font-medium hover:underline"
          >
            + Thêm giao dịch mới
          </Link>
        </div>
      ) : (
        <>
          <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
            {transactions.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0",
                    t.type === "income" ? "bg-emerald-50" : "bg-rose-50",
                  )}
                >
                  {t.categories?.icon ?? "💳"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {t.categories?.name ?? "Khác"}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">
                    {t.accounts?.name ?? ""}
                    {t.note ? (t.accounts?.name ? " · " : "") + t.note : ""}
                  </p>
                </div>
                <span
                  className={cn(
                    "text-sm font-semibold flex-shrink-0",
                    t.type === "income" ? "text-emerald-600" : "text-rose-500",
                  )}
                >
                  {t.type === "income" ? "+" : "−"}
                  {formatCurrency(t.amount)}
                </span>
              </div>
            ))}
          </div>
          {/* Category breakdown */}
          <CategoryBreakdown transactions={transactions} />
        </>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CalendarView({ userId, initialMonth, initialYear }: Props) {
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("normal");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // ── Realtime ──────────────────────────────────────────────────────────
  useRealtimeTransactions(userId);

  // ── Data ──────────────────────────────────────────────────────────────
  const {
    data: allTransactions = [],
    isLoading,
    isFetching,
  } = useTransactions(month, year);

  // ── Filtered transactions (for display on cells & search) ─────────────
  const transactions = useMemo(() => {
    let list = allTransactions;
    if (filter !== "all") list = list.filter((t) => t.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          (t.categories?.name ?? "").toLowerCase().includes(q) ||
          (t.note ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [allTransactions, filter, search]);

  // ── dayMap built from *filtered* transactions ─────────────────────────
  const dayMap = useMemo(() => {
    const map: Record<string, typeof transactions> = {};
    transactions.forEach((t) => {
      if (!map[t.date]) map[t.date] = [];
      map[t.date].push(t);
    });
    return map;
  }, [transactions]);

  // ── Monthly summaries (always from unfiltered) ────────────────────────
  const monthlyIncome = useMemo(
    () =>
      allTransactions
        .filter((t) => t.type === "income")
        .reduce((s, t) => s + t.amount, 0),
    [allTransactions],
  );
  const monthlyExpense = useMemo(
    () =>
      allTransactions
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + t.amount, 0),
    [allTransactions],
  );
  const monthlyNet = monthlyIncome - monthlyExpense;

  // ── Heatmap: max daily net delta across month ────────────────────────
  const maxDailyNetDelta = useMemo(() => {
    const vals = Object.values(dayMap).map((txs) => {
      const income = txs
        .filter((t) => t.type === "income")
        .reduce((s, t) => s + t.amount, 0);
      const expense = txs
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + t.amount, 0);
      return Math.abs(income - expense);
    });
    return Math.max(...vals, 1);
  }, [dayMap]);

  // ── Calendar grid ─────────────────────────────────────────────────────
  const today = new Date().toISOString().split("T")[0];
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysCount = new Date(year, month, 0).getDate();
  const cells = useMemo(
    () =>
      Array.from({ length: firstDay + daysCount }, (_, i) =>
        i < firstDay ? null : i - firstDay + 1,
      ),
    [firstDay, daysCount],
  );

  const isNextDisabled = useMemo(() => {
    const now = new Date();
    return (
      year > now.getFullYear() ||
      (year === now.getFullYear() && month >= now.getMonth() + 1)
    );
  }, [month, year]);

  // ── Navigation ────────────────────────────────────────────────────────
  const prevMonth = useCallback(() => {
    setSelected(null);
    setSearch("");
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  }, [month]);

  const nextMonth = useCallback(() => {
    if (isNextDisabled) return;
    setSelected(null);
    setSearch("");
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  }, [isNextDisabled, month]);

  const goToToday = useCallback(() => {
    const now = new Date();
    setMonth(now.getMonth() + 1);
    setYear(now.getFullYear());
    setSelected(today);
    setSearch("");
  }, [today]);

  // ── Selected day ──────────────────────────────────────────────────────
  // Detail panel uses allTransactions (not filtered) for the selected day
  const selectedTxs = useMemo(
    () => (selected ? allTransactions.filter((t) => t.date === selected) : []),
    [selected, allTransactions],
  );

  // ── Search results list ───────────────────────────────────────────────
  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    return transactions.slice().sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, search]);

  if (isLoading) return <CalendarSkeleton />;

  return (
    <div className="space-y-4">
      {/* ── Toolbar: filter + view mode + search + export ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Type filter pills */}
        <div className="flex items-center bg-white border border-gray-200 rounded-xl p-0.5 gap-0.5 shadow-sm">
          {(["all", "income", "expense"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all",
                filter === f
                  ? f === "income"
                    ? "bg-emerald-500 text-white shadow-sm"
                    : f === "expense"
                      ? "bg-rose-500    text-white shadow-sm"
                      : "bg-indigo-600  text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50",
              )}
            >
              {f === "all"
                ? "Tất cả"
                : f === "income"
                  ? "Thu nhập"
                  : "Chi tiêu"}
            </button>
          ))}
        </div>

        {/* Heatmap toggle */}
        <button
          onClick={() =>
            setViewMode((v) => (v === "normal" ? "heatmap" : "normal"))
          }
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all shadow-sm",
            viewMode === "heatmap"
              ? "bg-amber-50 border-amber-300 text-amber-700"
              : "bg-white border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300",
          )}
          title="Bật/tắt chế độ Heatmap"
        >
          🔥 Heatmap
        </button>

        {/* Search toggle */}
        <button
          onClick={() => {
            setShowSearch((v) => !v);
            setSearch("");
          }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all shadow-sm",
            showSearch
              ? "bg-indigo-50 border-indigo-300 text-indigo-700"
              : "bg-white border-gray-200 text-gray-500 hover:text-gray-700",
          )}
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
              strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
          Tìm kiếm
        </button>

        {/* Export CSV */}
        <button
          onClick={() => exportCSV(allTransactions, month, year)}
          disabled={allTransactions.length === 0}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-white border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          title="Tải xuống CSV"
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
              strokeWidth={2}
              d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M8 12l4 4 4-4M12 4v12"
            />
          </svg>
          Xuất CSV
        </button>
      </div>

      {/* Search input */}
      {showSearch && (
        <div className="relative animate-in fade-in duration-200">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo danh mục hoặc ghi chú..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 shadow-sm"
            autoFocus
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Search results list (shown instead of calendar when searching) */}
      {search.trim() && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-200">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">
              Kết quả:{" "}
              <span className="text-indigo-600">{searchResults.length}</span>{" "}
              giao dịch
            </p>
          </div>
          {searchResults.length === 0 ? (
            <p className="text-center py-8 text-sm text-gray-400">
              Không tìm thấy giao dịch nào
            </p>
          ) : (
            <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
              {searchResults.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0",
                      t.type === "income" ? "bg-emerald-50" : "bg-rose-50",
                    )}
                  >
                    {t.categories?.icon ?? "💳"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {t.categories?.name ?? "Khác"}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {formatDate(t.date, "dd/MM/yyyy")} ·{" "}
                      {t.accounts?.name ?? ""}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      t.type === "income"
                        ? "text-emerald-600"
                        : "text-rose-500",
                    )}
                  >
                    {t.type === "income" ? "+" : "−"}
                    {formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Main calendar card ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Navigation header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
            aria-label="Tháng trước"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <div className="flex items-center gap-2.5">
            <h2 className="font-semibold text-gray-900 text-[15px]">
              {MONTH_NAMES[month - 1]} {year}
            </h2>

            {/* Live badge */}
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100"
              title="Cập nhật thời gian thực"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span className="text-[10px] font-medium text-emerald-600">
                Live
              </span>
            </div>

            {/* Heatmap badge */}
            {viewMode === "heatmap" && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold border border-amber-200">
                🔥 Heatmap
              </span>
            )}

            {isFetching && !isLoading && (
              <svg
                className="w-3.5 h-3.5 text-indigo-400 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            )}
          </div>

          <div className="flex items-center gap-1">
            {(month !== new Date().getMonth() + 1 ||
              year !== new Date().getFullYear()) && (
              <button
                onClick={goToToday}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors mr-1"
              >
                Hôm nay
              </button>
            )}
            <button
              onClick={nextMonth}
              disabled={isNextDisabled}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Tháng sau"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Monthly summary strip */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50/50">
          <div className="px-4 py-3">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">
              Thu nhập
            </p>
            <p className="text-sm font-bold text-emerald-600 truncate">
              {monthlyIncome > 0 ? `+${formatCurrency(monthlyIncome)}` : "—"}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">
              Chi tiêu
            </p>
            <p className="text-sm font-bold text-rose-500 truncate">
              {monthlyExpense > 0 ? `−${formatCurrency(monthlyExpense)}` : "—"}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">
              Số dư
            </p>
            <p
              className={cn(
                "text-sm font-bold truncate",
                monthlyNet >= 0 ? "text-indigo-600" : "text-rose-500",
              )}
            >
              {allTransactions.length === 0
                ? "—"
                : `${monthlyNet >= 0 ? "+" : "−"}${formatCurrency(Math.abs(monthlyNet))}`}
            </p>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/30">
          {WEEKDAYS.map((d, i) => (
            <div
              key={d}
              className={cn(
                "py-2 text-center text-[11px] font-semibold uppercase tracking-wider",
                i === 0
                  ? "text-rose-400"
                  : i === 6
                    ? "text-sky-400"
                    : "text-gray-400",
              )}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (!day)
              return (
                <div
                  key={`empty-${idx}`}
                  className="h-[88px] border-r border-b border-gray-50 bg-gray-50/30"
                />
              );

            const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const txs = dayMap[dateStr] ?? [];
            const dayIncome = txs
              .filter((t) => t.type === "income")
              .reduce((s, t) => s + t.amount, 0);
            const dayExpense = txs
              .filter((t) => t.type === "expense")
              .reduce((s, t) => s + t.amount, 0);
            const dayOfWeek = new Date(dateStr).getDay();
            const isFuture = dateStr > today;
            const hasRecurring = txs.some(
              (t) => (t as { is_recurring?: boolean }).is_recurring,
            );
            const dayNet = dayIncome - dayExpense;
            const heatDirection =
              dayNet > 0 ? "positive" : dayNet < 0 ? "negative" : null;

            return (
              <DayCell
                key={dateStr}
                day={day}
                dateStr={dateStr}
                income={dayIncome}
                expense={dayExpense}
                txCount={txs.length}
                icons={txs.map((t) => t.categories?.icon ?? null)}
                isRecurring={hasRecurring}
                isToday={dateStr === today}
                isSunday={dayOfWeek === 0}
                isSaturday={dayOfWeek === 6}
                isSelected={dateStr === selected}
                isFuture={isFuture}
                viewMode={viewMode}
                heatRatio={Math.min(Math.abs(dayNet) / maxDailyNetDelta, 1)}
                heatDirection={heatDirection}
                onClick={() =>
                  !isFuture &&
                  setSelected(dateStr === selected ? null : dateStr)
                }
              />
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-gray-100 bg-gray-50/30 flex flex-wrap items-center gap-x-4 gap-y-1">
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Thu nhiều hơn chi
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Chi nhiều hơn thu
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <span className="text-[10px]">🔁</span>Định kỳ
          </div>
          <div className="ml-auto text-[11px] text-gray-400">
            {allTransactions.length} giao dịch
            {filter !== "all" && ` · lọc: ${transactions.length}`}
          </div>
        </div>
      </div>

      {/* ── Trend chart ── */}
      {allTransactions.length > 0 && (
        <TrendChart
          daysCount={daysCount}
          month={month}
          year={year}
          dayMap={dayMap}
        />
      )}

      {/* ── Selected day detail panel ── */}
      {selected && (
        <TxPanel
          key={selected}
          dateStr={selected}
          transactions={selectedTxs}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
