// src/components/charts/CompareChart.tsx
"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils/format";
import { useTransactionsByRange, getWeekRange } from "@/hooks/useTransactions";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils/cn";

// ─── Types ────────────────────────────────────────────────────────────────────

type CompareMode = "day" | "week" | "month";

interface TxRow {
  amount: number;
  type: string;
  date: string;
}

interface SummaryBlock {
  income: number;
  expense: number;
  net: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function summarise(rows: TxRow[]): SummaryBlock {
  const income = rows
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expense = rows
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  return { income, expense, net: income - expense };
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function fmt(d: Date) {
  return d.toISOString().split("T")[0];
}

function addMonths(d: Date, n: number) {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  return r;
}

// ─── Delta Badge ─────────────────────────────────────────────────────────────

function DeltaBadge({
  pct,
  invert = false,
}: {
  pct: number | null;
  invert?: boolean;
}) {
  if (pct === null) return <span className="text-[10px] text-gray-400">—</span>;
  const up = pct >= 0;
  const good = invert ? !up : up; // for expense, decrease is good
  const display = `${up ? "+" : ""}${pct.toFixed(1)}%`;
  return (
    <span
      className={cn(
        "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
        good
          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
          : "bg-rose-50 text-rose-600 border border-rose-100",
      )}
    >
      {display}
    </span>
  );
}

// ─── Summary Comparison Row ───────────────────────────────────────────────────

function CompareRow({
  label,
  icon,
  current,
  previous,
  invert = false,
}: {
  label: string;
  icon: string;
  current: number;
  previous: number;
  invert?: boolean;
}) {
  const delta = pctChange(current, previous);
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-base w-6 text-center shrink-0">{icon}</span>
      <span className="flex-1 text-sm text-gray-600">{label}</span>
      <div className="text-right shrink-0 space-y-0.5">
        <p
          className={cn(
            "text-sm font-semibold",
            current < 0 ? "text-rose-500" : "text-gray-900",
          )}
        >
          {formatCurrency(current)}
        </p>
        <p className="text-[10px] text-gray-400">
          KN: {formatCurrency(previous)}
        </p>
      </div>
      <DeltaBadge pct={delta} invert={invert} />
    </div>
  );
}

// ─── Day Comparison ───────────────────────────────────────────────────────────

function DayCompare() {
  const now = new Date();
  const todayStr = fmt(now);
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  const yesterStr = fmt(yest);

  const { data: todayTx = [], isLoading: l1 } = useTransactionsByRange(
    todayStr,
    todayStr,
  );
  const { data: yesterTx = [], isLoading: l2 } = useTransactionsByRange(
    yesterStr,
    yesterStr,
  );

  const today = useMemo(() => summarise(todayTx), [todayTx]);
  const yest_ = useMemo(() => summarise(yesterTx), [yesterTx]);

  if (l1 || l2) return <Skeleton className="h-40 w-full" />;

  const noData =
    today.income === 0 &&
    today.expense === 0 &&
    yest_.income === 0 &&
    yest_.expense === 0;

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: "Hôm nay", s: today, accent: "indigo" },
          { label: "Hôm qua", s: yest_, accent: "gray" },
        ].map(({ label, s, accent }) => (
          <div
            key={label}
            className={cn(
              "rounded-xl p-3 border",
              accent === "indigo"
                ? "bg-indigo-50 border-indigo-100"
                : "bg-gray-50 border-gray-100",
            )}
          >
            <p className="text-[11px] font-semibold text-gray-400 mb-2">
              {label}
            </p>
            <p className="text-xs text-emerald-600 font-semibold">
              {s.income > 0 ? `↑ ${formatCurrency(s.income)}` : "—"}
            </p>
            <p className="text-xs text-rose-500 font-semibold">
              {s.expense > 0 ? `↓ ${formatCurrency(s.expense)}` : "—"}
            </p>
            <p
              className={cn(
                "text-sm font-bold mt-1.5",
                s.net >= 0 ? "text-indigo-700" : "text-rose-600",
              )}
            >
              {s.net !== 0
                ? `${s.net > 0 ? "+" : "−"}${formatCurrency(Math.abs(s.net))}`
                : "0 ₫"}
            </p>
          </div>
        ))}
      </div>

      {noData ? (
        <p className="text-center py-4 text-sm text-gray-400">
          Không có giao dịch hôm nay và hôm qua
        </p>
      ) : (
        <>
          <CompareRow
            label="Thu nhập"
            icon="📈"
            current={today.income}
            previous={yest_.income}
          />
          <CompareRow
            label="Chi tiêu"
            icon="📉"
            current={today.expense}
            previous={yest_.expense}
            invert
          />
          <CompareRow
            label="Số dư"
            icon="💰"
            current={today.net}
            previous={yest_.net}
          />
        </>
      )}
    </div>
  );
}

// ─── Week Comparison ──────────────────────────────────────────────────────────

const DAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const JS_TO_IDX: Record<number, number> = {
  1: 0,
  2: 1,
  3: 2,
  4: 3,
  5: 4,
  6: 5,
  0: 6,
};

function WeekCompare() {
  const now = new Date();
  const thisWeek = getWeekRange(now);
  const lastMonday = new Date(now);
  lastMonday.setDate(now.getDate() - 7);
  const lastWeek = getWeekRange(lastMonday);

  const { data: thisTx = [], isLoading: l1 } = useTransactionsByRange(
    thisWeek.start,
    thisWeek.end,
  );
  const { data: lastTx = [], isLoading: l2 } = useTransactionsByRange(
    lastWeek.start,
    lastWeek.end,
  );

  const chartData = useMemo(() => {
    const buckets = DAY_LABELS.map((name) => ({
      name,
      thisIncome: 0,
      thisExpense: 0,
      lastIncome: 0,
      lastExpense: 0,
    }));
    thisTx.forEach((t) => {
      const idx = JS_TO_IDX[new Date(t.date).getDay()];
      if (t.type === "income") buckets[idx].thisIncome += t.amount;
      if (t.type === "expense") buckets[idx].thisExpense += t.amount;
    });
    lastTx.forEach((t) => {
      const idx = JS_TO_IDX[new Date(t.date).getDay()];
      if (t.type === "income") buckets[idx].lastIncome += t.amount;
      if (t.type === "expense") buckets[idx].lastExpense += t.amount;
    });
    return buckets;
  }, [thisTx, lastTx]);

  const thisSum = useMemo(() => summarise(thisTx), [thisTx]);
  const lastSum = useMemo(() => summarise(lastTx), [lastTx]);
  const hasData = chartData.some(
    (d) => d.thisIncome || d.thisExpense || d.lastIncome || d.lastExpense,
  );

  if (l1 || l2) return <Skeleton className="h-52 w-full" />;

  return (
    <div>
      {/* Week summary row */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          {
            label: `Tuần này (${thisWeek.start.slice(5)})`,
            s: thisSum,
            accent: "indigo",
          },
          {
            label: `Tuần trước (${lastWeek.start.slice(5)})`,
            s: lastSum,
            accent: "gray",
          },
        ].map(({ label, s, accent }) => (
          <div
            key={label}
            className={cn(
              "rounded-xl p-3 border",
              accent === "indigo"
                ? "bg-indigo-50 border-indigo-100"
                : "bg-gray-50 border-gray-100",
            )}
          >
            <p className="text-[10px] font-semibold text-gray-400 mb-1.5 truncate">
              {label}
            </p>
            <p className="text-xs text-emerald-600 font-semibold">
              {s.income > 0 ? `↑ ${formatCurrency(s.income)}` : "—"}
            </p>
            <p className="text-xs text-rose-500 font-semibold">
              {s.expense > 0 ? `↓ ${formatCurrency(s.expense)}` : "—"}
            </p>
            <p
              className={cn(
                "text-sm font-bold mt-1",
                s.net >= 0 ? "text-indigo-700" : "text-rose-600",
              )}
            >
              {s.net !== 0
                ? `${s.net > 0 ? "+" : "−"}${formatCurrency(Math.abs(s.net))}`
                : "0 ₫"}
            </p>
          </div>
        ))}
      </div>

      {!hasData ? (
        <p className="text-center py-4 text-sm text-gray-400">
          Không có giao dịch trong 2 tuần qua
        </p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={chartData} barGap={2} barCategoryGap="30%">
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#F3F4F6"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#6B7280", fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v: number) =>
                  v >= 1e6
                    ? `${(v / 1e6).toFixed(0)}M`
                    : v >= 1e3
                      ? `${(v / 1e3).toFixed(0)}K`
                      : String(v)
                }
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any, name?: any) => [
                  formatCurrency(Number(value)),
                  name === "thisExpense"
                    ? "Chi (tuần này)"
                    : name === "thisIncome"
                      ? "Thu (tuần này)"
                      : name === "lastExpense"
                        ? "Chi (tuần trước)"
                        : "Thu (tuần trước)",
                ]}
                contentStyle={{
                  borderRadius: "10px",
                  border: "1px solid #E5E7EB",
                  fontSize: "12px",
                }}
                cursor={{ fill: "#F9FAFB" }}
              />
              <Bar
                dataKey="thisIncome"
                fill="#4F46E5"
                radius={[4, 4, 0, 0]}
                maxBarSize={14}
              />
              <Bar
                dataKey="thisExpense"
                fill="#FB7185"
                radius={[4, 4, 0, 0]}
                maxBarSize={14}
              />
              <Bar
                dataKey="lastIncome"
                fill="#A5B4FC"
                radius={[4, 4, 0, 0]}
                maxBarSize={14}
              />
              <Bar
                dataKey="lastExpense"
                fill="#FECDD3"
                radius={[4, 4, 0, 0]}
                maxBarSize={14}
              />
            </BarChart>
          </ResponsiveContainer>

          {/* Delta summary */}
          <div className="mt-3 space-y-0.5">
            <CompareRow
              label="Thu nhập"
              icon="📈"
              current={thisSum.income}
              previous={lastSum.income}
            />
            <CompareRow
              label="Chi tiêu"
              icon="📉"
              current={thisSum.expense}
              previous={lastSum.expense}
              invert
            />
            <CompareRow
              label="Số dư"
              icon="💰"
              current={thisSum.net}
              previous={lastSum.net}
            />
          </div>
        </>
      )}
    </div>
  );
}

// ─── Month Comparison ─────────────────────────────────────────────────────────

function MonthCompare() {
  const now = new Date();
  const cur = {
    start: fmt(new Date(now.getFullYear(), now.getMonth(), 1)),
    end: fmt(now),
  };
  const prev = (() => {
    const p = addMonths(now, -1);
    return {
      start: fmt(new Date(p.getFullYear(), p.getMonth(), 1)),
      end: fmt(new Date(p.getFullYear(), p.getMonth() + 1, 0)),
    };
  })();

  const { data: curTx = [], isLoading: l1 } = useTransactionsByRange(
    cur.start,
    cur.end,
  );
  const { data: prevTx = [], isLoading: l2 } = useTransactionsByRange(
    prev.start,
    prev.end,
  );

  const curSum = useMemo(() => summarise(curTx), [curTx]);
  const prevSum = useMemo(() => summarise(prevTx), [prevTx]);

  // Build daily expense series for both months — for the area/bar chart
  const chartData = useMemo(() => {
    const daysInCur = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).getDate();
    const daysInPrev = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    const maxDays = Math.max(daysInCur, daysInPrev);
    const result: { day: number; curExpense: number; prevExpense: number }[] =
      [];

    const curByDay: Record<number, number> = {};
    const prevByDay: Record<number, number> = {};
    curTx
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const d = new Date(t.date).getDate();
        curByDay[d] = (curByDay[d] || 0) + t.amount;
      });
    prevTx
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const d = new Date(t.date).getDate();
        prevByDay[d] = (prevByDay[d] || 0) + t.amount;
      });

    for (let d = 1; d <= maxDays; d++) {
      result.push({
        day: d,
        curExpense: curByDay[d] ?? 0,
        prevExpense: prevByDay[d] ?? 0,
      });
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curTx, prevTx]);

  const curMonth = now.getMonth() + 1;
  const prevMonth = curMonth === 1 ? 12 : curMonth - 1;

  if (l1 || l2) return <Skeleton className="h-52 w-full" />;

  const hasData =
    curSum.income > 0 ||
    curSum.expense > 0 ||
    prevSum.income > 0 ||
    prevSum.expense > 0;

  return (
    <div>
      {/* Month cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: `Tháng ${curMonth}`, s: curSum, accent: "indigo" },
          { label: `Tháng ${prevMonth}`, s: prevSum, accent: "gray" },
        ].map(({ label, s, accent }) => (
          <div
            key={label}
            className={cn(
              "rounded-xl p-3 border",
              accent === "indigo"
                ? "bg-indigo-50 border-indigo-100"
                : "bg-gray-50 border-gray-100",
            )}
          >
            <p className="text-[11px] font-semibold text-gray-400 mb-1.5">
              {label}
            </p>
            <p className="text-xs text-emerald-600 font-semibold">
              ↑ {formatCurrency(s.income)}
            </p>
            <p className="text-xs text-rose-500 font-semibold">
              ↓ {formatCurrency(s.expense)}
            </p>
            <p
              className={cn(
                "text-sm font-bold mt-1",
                s.net >= 0 ? "text-indigo-700" : "text-rose-600",
              )}
            >
              {s.net >= 0 ? "+" : "−"}
              {formatCurrency(Math.abs(s.net))}
            </p>
          </div>
        ))}
      </div>

      {!hasData ? (
        <p className="text-center py-4 text-sm text-gray-400">
          Không có dữ liệu để so sánh
        </p>
      ) : (
        <>
          {/* Daily expense comparison chart */}
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} barGap={1} barCategoryGap="20%">
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#F3F4F6"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 9, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
                interval={4}
              />
              <YAxis
                tickFormatter={(v: number) =>
                  v >= 1e6
                    ? `${(v / 1e6).toFixed(0)}M`
                    : v >= 1e3
                      ? `${(v / 1e3).toFixed(0)}K`
                      : String(v)
                }
                tick={{ fontSize: 9, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any, name?: any) => [
                  formatCurrency(Number(value)),
                  name === "curExpense"
                    ? `Chi - T${curMonth}`
                    : `Chi - T${prevMonth}`,
                ]}
                contentStyle={{
                  borderRadius: "10px",
                  border: "1px solid #E5E7EB",
                  fontSize: "11px",
                }}
                cursor={{ fill: "#F9FAFB" }}
                labelFormatter={(l) => `Ngày ${l}`}
              />
              <Bar
                dataKey="curExpense"
                name="curExpense"
                fill="#FB7185"
                radius={[3, 3, 0, 0]}
                maxBarSize={10}
              />
              <Bar
                dataKey="prevExpense"
                name="prevExpense"
                fill="#FECDD3"
                radius={[3, 3, 0, 0]}
                maxBarSize={10}
              />
            </BarChart>
          </ResponsiveContainer>

          {/* Delta rows */}
          <div className="mt-3 space-y-0.5">
            <CompareRow
              label="Thu nhập"
              icon="📈"
              current={curSum.income}
              previous={prevSum.income}
            />
            <CompareRow
              label="Chi tiêu"
              icon="📉"
              current={curSum.expense}
              previous={prevSum.expense}
              invert
            />
            <CompareRow
              label="Số dư"
              icon="💰"
              current={curSum.net}
              previous={prevSum.net}
            />
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

interface CompareChartProps {
  defaultMode?: CompareMode;
}

export function CompareChart({ defaultMode = "month" }: CompareChartProps) {
  const [mode, setMode] = useState<CompareMode>(defaultMode);

  const tabs: { key: CompareMode; label: string; icon: string }[] = [
    { key: "day", label: "Ngày", icon: "📅" },
    { key: "week", label: "Tuần", icon: "📆" },
    { key: "month", label: "Tháng", icon: "🗓️" },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-[15px]">
            So sánh dòng tiền
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {mode === "day"
              ? "Hôm nay vs Hôm qua"
              : mode === "week"
                ? "Tuần này vs Tuần trước"
                : "Tháng này vs Tháng trước"}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-gray-100 rounded-xl p-0.5 gap-0.5">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setMode(t.key)}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all",
                mode === t.key
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700",
              )}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {mode === "day" && <DayCompare />}
      {mode === "week" && <WeekCompare />}
      {mode === "month" && <MonthCompare />}
    </div>
  );
}
