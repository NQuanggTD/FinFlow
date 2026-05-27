"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatCompact } from "@/lib/utils/format";
import { useTransactionsByRange } from "@/hooks/useTransactions";
import { useRealtimeTransactions } from "@/hooks/useSupabaseRealtime";
import { Skeleton } from "@/components/ui/Skeleton";
import { Card, CardHeader } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";

interface Props {
  userId: string;
  currentMonth: number;
  currentYear: number;
}

const MONTH_SHORT = [
  "T1",
  "T2",
  "T3",
  "T4",
  "T5",
  "T6",
  "T7",
  "T8",
  "T9",
  "T10",
  "T11",
  "T12",
];
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
const PALETTE = [
  "#4F46E5",
  "#7C3AED",
  "#0891B2",
  "#16A34A",
  "#D97706",
  "#DC2626",
  "#DB2777",
  "#65A30D",
  "#EA580C",
  "#0284C7",
];

function pctDiff(cur: number, prev: number) {
  if (prev === 0) return null;
  return ((cur - prev) / prev) * 100;
}

function fmt(d: Date) {
  return d.toISOString().split("T")[0];
}

function buildYearRange(currentMonth: number, currentYear: number) {
  const end = new Date(currentYear, currentMonth - 1 + 1, 0);
  const start = new Date(currentYear, currentMonth - 1 - 11, 1);
  return { start: fmt(start), end: fmt(end) };
}

function StatCard({
  label,
  value,
  sub,
  color = "indigo",
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  icon: string;
}) {
  const bg: Record<string, string> = {
    indigo: "bg-indigo-50 border-indigo-100 text-indigo-700",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
    rose: "bg-rose-50 border-rose-100 text-rose-700",
    amber: "bg-amber-50 border-amber-100 text-amber-700",
  };

  return (
    <div className={cn("rounded-2xl p-4 border", bg[color] ?? bg.indigo)}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-60 mb-1">
        {label}
      </p>
      <p className="text-xl font-bold leading-tight">{value}</p>
      {sub && <p className="text-[11px] opacity-60 mt-1">{sub}</p>}
    </div>
  );
}

function ChartSkeleton({ h = 220 }: { h?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="w-full rounded-xl bg-gray-200" style={{ height: h }} />
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CurrencyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm min-w-40">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map(
        (p: {
          name: string;
          value: number;
          color: string;
          dataKey: string;
        }) => (
          <p
            key={p.dataKey}
            style={{ color: p.color }}
            className="flex justify-between gap-4"
          >
            <span>
              {p.dataKey === "income"
                ? "Thu nhập"
                : p.dataKey === "expense"
                  ? "Chi tiêu"
                  : p.dataKey === "saving"
                    ? "Tiết kiệm"
                    : p.name}
            </span>
            <span className="font-semibold">{formatCurrency(p.value)}</span>
          </p>
        ),
      )}
    </div>
  );
}

export function ReportsShell({ userId, currentMonth, currentYear }: Props) {
  const [activeSection, setActiveSection] = useState<
    "overview" | "trend" | "category" | "weekday" | "saving" | "table"
  >("overview");

  useRealtimeTransactions(userId);

  const { start, end } = buildYearRange(currentMonth, currentYear);
  const { data: txAll = [], isLoading } = useTransactionsByRange(start, end);

  const monthlyData = useMemo(() => {
    const map: Record<
      string,
      {
        income: number;
        expense: number;
        label: string;
        monthNum: number;
        yearNum: number;
      }
    > = {};

    for (let i = 11; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1 - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map[key] = {
        income: 0,
        expense: 0,
        label: MONTH_SHORT[d.getMonth()],
        monthNum: d.getMonth() + 1,
        yearNum: d.getFullYear(),
      };
    }

    txAll.forEach((t) => {
      const key = t.date.slice(0, 7);
      if (map[key]) {
        if (t.type === "income") map[key].income += t.amount;
        if (t.type === "expense") map[key].expense += t.amount;
      }
    });

    return Object.values(map).map((m) => ({
      ...m,
      saving: m.income - m.expense,
      savingRate:
        m.income > 0
          ? Math.round(((m.income - m.expense) / m.income) * 100)
          : 0,
    }));
  }, [txAll, currentMonth, currentYear]);

  const totals = useMemo(() => {
    const income = monthlyData.reduce((s, m) => s + m.income, 0);
    const expense = monthlyData.reduce((s, m) => s + m.expense, 0);
    const saving = income - expense;
    const avgExpense = expense / 12;
    const bestMonth = [...monthlyData].sort((a, b) => b.saving - a.saving)[0];
    const worstMonth = [...monthlyData].sort((a, b) => a.saving - b.saving)[0];

    return {
      income,
      expense,
      saving,
      avgExpense,
      bestMonth,
      worstMonth,
      savingRate: income > 0 ? Math.round((saving / income) * 100) : 0,
    };
  }, [monthlyData]);

  const categoryData = useMemo(() => {
    const expMap: Record<
      string,
      { name: string; icon: string; color: string; total: number }
    > = {};
    const incMap: Record<
      string,
      { name: string; icon: string; color: string; total: number }
    > = {};

    txAll.forEach((t) => {
      const key = t.categories?.name ?? "Khác";
      const icon = t.categories?.icon ?? "💳";
      const clr = t.categories?.color ?? "#6B7280";

      if (t.type === "expense") {
        if (!expMap[key])
          expMap[key] = { name: key, icon, color: clr, total: 0 };
        expMap[key].total += t.amount;
      } else {
        if (!incMap[key])
          incMap[key] = { name: key, icon, color: clr, total: 0 };
        incMap[key].total += t.amount;
      }
    });

    const expense = Object.values(expMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
    const income = Object.values(incMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
    const expTotal = expense.reduce((s, c) => s + c.total, 0);
    const incTotal = income.reduce((s, c) => s + c.total, 0);
    return { expense, income, expTotal, incTotal };
  }, [txAll]);

  const weekdayData = useMemo(() => {
    const buckets = DAY_LABELS.map((name) => ({
      name,
      income: 0,
      expense: 0,
      count: 0,
    }));
    txAll.forEach((t) => {
      const idx = JS_TO_IDX[new Date(t.date).getDay()];
      if (t.type === "income") buckets[idx].income += t.amount;
      if (t.type === "expense") buckets[idx].expense += t.amount;
      buckets[idx].count++;
    });
    return buckets;
  }, [txAll]);

  const maxExpenseDay = useMemo(
    () =>
      weekdayData.reduce(
        (a, b) => (b.expense > a.expense ? b : a),
        weekdayData[0],
      ),
    [weekdayData],
  );

  const SECTIONS = [
    { key: "overview", label: "Tổng quan", icon: "📊" },
    { key: "trend", label: "Xu hướng", icon: "📈" },
    { key: "category", label: "Danh mục", icon: "🏷️" },
    { key: "weekday", label: "Theo thứ", icon: "📅" },
    { key: "saving", label: "Tiết kiệm", icon: "💰" },
    { key: "table", label: "Chi tiết", icon: "📋" },
  ] as const;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
        <ChartSkeleton h={260} />
      </div>
    );
  }

  const hasData = txAll.length > 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon="💵"
          label="Tổng thu nhập"
          color="emerald"
          value={formatCompact(totals.income)}
          sub={`12 tháng — ${formatCurrency(totals.income / 12)}/tháng`}
        />
        <StatCard
          icon="🛍️"
          label="Tổng chi tiêu"
          color="rose"
          value={formatCompact(totals.expense)}
          sub={`Trung bình ${formatCurrency(totals.avgExpense)}/tháng`}
        />
        <StatCard
          icon="🏦"
          label="Tổng tiết kiệm"
          color={totals.saving >= 0 ? "indigo" : "rose"}
          value={`${totals.saving >= 0 ? "+" : ""}${formatCompact(totals.saving)}`}
          sub={`Tỷ lệ tiết kiệm: ${totals.savingRate}%`}
        />
        <StatCard
          icon="📆"
          label="Tháng tốt nhất"
          color="amber"
          value={totals.bestMonth?.label ?? "—"}
          sub={
            totals.bestMonth
              ? `Tiết kiệm ${formatCompact(totals.bestMonth.saving)}`
              : undefined
          }
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-0.5 p-1.5 min-w-max">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap",
                activeSection === s.key
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50",
              )}
            >
              <span>{s.icon}</span> {s.label}
            </button>
          ))}
        </div>
      </div>

      {!hasData && (
        <Card className="py-16 flex flex-col items-center gap-3 text-center">
          <span className="text-5xl">📭</span>
          <p className="text-gray-500 font-medium">
            Chưa có dữ liệu giao dịch trong 12 tháng qua
          </p>
          <p className="text-sm text-gray-400">
            Thêm giao dịch đầu tiên để xem báo cáo
          </p>
        </Card>
      )}

      {activeSection === "overview" && hasData && (
        <Card>
          <CardHeader
            title="Thu chi theo tháng"
            subtitle={`${MONTH_SHORT[new Date(start).getMonth()]}/${new Date(start).getFullYear()} → ${MONTH_SHORT[currentMonth - 1]}/${currentYear}`}
          />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData} barGap={4} barCategoryGap="25%">
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#F3F4F6"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => formatCompact(v)}
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
                width={44}
              />
              <Tooltip
                content={<CurrencyTooltip />}
                cursor={{ fill: "#F9FAFB" }}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
                formatter={(v) => (v === "income" ? "Thu nhập" : "Chi tiêu")}
              />
              <Bar
                dataKey="income"
                fill="#4F46E5"
                radius={[5, 5, 0, 0]}
                maxBarSize={24}
              />
              <Bar
                dataKey="expense"
                fill="#FB7185"
                radius={[5, 5, 0, 0]}
                maxBarSize={24}
              />
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-6 lg:grid-cols-12 gap-1">
            {monthlyData.map((m, index) => {
              const pct = pctDiff(
                m.expense,
                monthlyData[Math.max(0, index - 1)]?.expense ?? 0,
              );
              return (
                <div key={m.label} className="text-center">
                  <p className="text-[9px] text-gray-400 font-medium">
                    {m.label}
                  </p>
                  <div
                    className={cn(
                      "mx-auto mt-1 w-6 rounded-sm",
                      m.income >= m.expense ? "bg-indigo-200" : "bg-rose-200",
                    )}
                    style={{
                      height: Math.max(
                        4,
                        Math.round(
                          (m.expense / (totals.avgExpense * 2 || 1)) * 32,
                        ),
                      ),
                    }}
                  />
                  {pct !== null && (
                    <p
                      className={cn(
                        "text-[8px] mt-0.5 font-semibold",
                        pct <= 0 ? "text-emerald-500" : "text-rose-500",
                      )}
                    >
                      {pct > 0 ? "+" : ""}
                      {pct.toFixed(0)}%
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {activeSection === "trend" && hasData && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Xu hướng dòng tiền"
              subtitle="Thu nhập, chi tiêu và tiết kiệm qua 12 tháng"
            />
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FB7185" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#FB7185" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gSaving" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#F3F4F6"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v: number) => formatCompact(v)}
                  tick={{ fontSize: 10, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                />
                <ReferenceLine y={0} stroke="#E5E7EB" />
                <Tooltip content={<CurrencyTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                  formatter={(v) =>
                    v === "income"
                      ? "Thu nhập"
                      : v === "expense"
                        ? "Chi tiêu"
                        : "Tiết kiệm"
                  }
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#4F46E5"
                  strokeWidth={2}
                  fill="url(#gIncome)"
                  dot={{ r: 3, fill: "#4F46E5" }}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#FB7185"
                  strokeWidth={2}
                  fill="url(#gExpense)"
                  dot={{ r: 3, fill: "#FB7185" }}
                />
                <Area
                  type="monotone"
                  dataKey="saving"
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="url(#gSaving)"
                  dot={{ r: 3, fill: "#10B981" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <CardHeader
              title="Tỷ lệ tiết kiệm (%) theo tháng"
              subtitle="Mục tiêu khuyến nghị: ≥ 20%"
            />
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={monthlyData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#F3F4F6"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  unit="%"
                  tick={{ fontSize: 10, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                  domain={["auto", "auto"]}
                />
                <ReferenceLine
                  y={20}
                  stroke="#10B981"
                  strokeDasharray="4 4"
                  label={{
                    value: "20%",
                    position: "right",
                    fontSize: 10,
                    fill: "#10B981",
                  }}
                />
                <Tooltip
                  formatter={(v: unknown) => [`${v}%`, "Tỷ lệ tiết kiệm"]}
                  contentStyle={{ borderRadius: "10px", fontSize: "12px" }}
                />
                <Line
                  type="monotone"
                  dataKey="savingRate"
                  stroke="#4F46E5"
                  strokeWidth={2.5}
                  dot={(props) => {
                    const dotProps = props as {
                      cx?: number;
                      cy?: number;
                      payload?: { savingRate?: number };
                    };
                    const cx = dotProps.cx ?? 0;
                    const cy = dotProps.cy ?? 0;
                    const savingRate = dotProps.payload?.savingRate ?? 0;
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill={savingRate >= 20 ? "#10B981" : "#FB7185"}
                        stroke="white"
                        strokeWidth={1.5}
                      />
                    );
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {activeSection === "category" && hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader
              title="📉 Chi tiêu theo danh mục"
              subtitle={`Tổng: ${formatCompact(categoryData.expTotal)}`}
            />
            {categoryData.expense.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                Chưa có dữ liệu
              </p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={categoryData.expense}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="total"
                    >
                      {categoryData.expense.map((_, i) => (
                        <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: unknown) => formatCurrency(Number(v))}
                      contentStyle={{ borderRadius: "10px", fontSize: "12px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {categoryData.expense.map((c, i) => {
                    const pct =
                      categoryData.expTotal > 0
                        ? (c.total / categoryData.expTotal) * 100
                        : 0;
                    return (
                      <div key={c.name} className="flex items-center gap-2">
                        <span className="text-sm">{c.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-xs font-medium text-gray-700 truncate">
                              {c.name}
                            </span>
                            <span className="text-xs font-semibold text-gray-600 ml-2 shrink-0">
                              {formatCompact(c.total)}
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: PALETTE[i % PALETTE.length],
                              }}
                            />
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-400 w-8 text-right shrink-0">
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </Card>

          <Card>
            <CardHeader
              title="📈 Thu nhập theo danh mục"
              subtitle={`Tổng: ${formatCompact(categoryData.incTotal)}`}
            />
            {categoryData.income.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                Chưa có dữ liệu
              </p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={categoryData.income}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="total"
                    >
                      {categoryData.income.map((_, i) => (
                        <Cell
                          key={i}
                          fill={
                            [
                              "#10B981",
                              "#16A34A",
                              "#059669",
                              "#34D399",
                              "#6EE7B7",
                              "#A7F3D0",
                              "#047857",
                              "#065F46",
                            ][i % 8]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: unknown) => formatCurrency(Number(v))}
                      contentStyle={{ borderRadius: "10px", fontSize: "12px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {categoryData.income.map((c, i) => {
                    const clrs = [
                      "#10B981",
                      "#16A34A",
                      "#059669",
                      "#34D399",
                      "#6EE7B7",
                      "#A7F3D0",
                      "#047857",
                      "#065F46",
                    ];
                    const pct =
                      categoryData.incTotal > 0
                        ? (c.total / categoryData.incTotal) * 100
                        : 0;
                    return (
                      <div key={c.name} className="flex items-center gap-2">
                        <span className="text-sm">{c.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-xs font-medium text-gray-700 truncate">
                              {c.name}
                            </span>
                            <span className="text-xs font-semibold text-gray-600 ml-2 shrink-0">
                              {formatCompact(c.total)}
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: clrs[i % clrs.length],
                              }}
                            />
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-400 w-8 text-right shrink-0">
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      {activeSection === "weekday" && hasData && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Chi tiêu theo ngày trong tuần"
              subtitle={`Ngày chi nhiều nhất: ${maxExpenseDay?.name ?? "—"} (${formatCompact(maxExpenseDay?.expense ?? 0)})`}
            />
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weekdayData} barGap={4} barCategoryGap="30%">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#F3F4F6"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#6B7280", fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v: number) => formatCompact(v)}
                  tick={{ fontSize: 10, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                />
                <Tooltip
                  content={<CurrencyTooltip />}
                  cursor={{ fill: "#F9FAFB" }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                  formatter={(v) => (v === "income" ? "Thu nhập" : "Chi tiêu")}
                />
                <Bar
                  dataKey="income"
                  fill="#4F46E5"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={32}
                >
                  {weekdayData.map((_, i) => (
                    <Cell key={i} fill="#4F46E5" />
                  ))}
                </Bar>
                <Bar
                  dataKey="expense"
                  fill="#FB7185"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={32}
                >
                  {weekdayData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        entry.name === maxExpenseDay?.name
                          ? "#E11D48"
                          : "#FB7185"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-7 gap-1.5 mt-4 pt-4 border-t border-gray-50">
              {weekdayData.map((d) => {
                const isMax = d.name === maxExpenseDay?.name;
                return (
                  <div
                    key={d.name}
                    className={cn(
                      "rounded-xl p-2 text-center transition-all",
                      isMax
                        ? "bg-rose-50 border border-rose-100"
                        : "bg-gray-50",
                    )}
                  >
                    <p
                      className={cn(
                        "text-xs font-bold mb-1",
                        isMax ? "text-rose-600" : "text-gray-500",
                      )}
                    >
                      {d.name}
                    </p>
                    <p className="text-[9px] text-rose-500 font-semibold leading-tight">
                      {formatCompact(d.expense)}
                    </p>
                    <p className="text-[9px] text-indigo-500 font-semibold leading-tight">
                      {formatCompact(d.income)}
                    </p>
                    <p className="text-[8px] text-gray-400 mt-1">
                      {d.count} GD
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {activeSection === "saving" && hasData && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Tỷ lệ tiết kiệm theo tháng"
              subtitle="Xanh = ≥ 20% (đạt mục tiêu), Đỏ = dưới mục tiêu"
            />
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} barCategoryGap="30%">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#F3F4F6"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  unit="%"
                  tick={{ fontSize: 10, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <ReferenceLine y={20} stroke="#10B981" strokeDasharray="4 4" />
                <Tooltip
                  formatter={(v: unknown) => [`${v}%`, "Tỷ lệ tiết kiệm"]}
                  contentStyle={{ borderRadius: "10px", fontSize: "12px" }}
                />
                <Bar dataKey="savingRate" radius={[5, 5, 0, 0]} maxBarSize={28}>
                  {monthlyData.map((m, i) => (
                    <Cell
                      key={i}
                      fill={
                        m.savingRate >= 20
                          ? "#10B981"
                          : m.savingRate >= 0
                            ? "#F59E0B"
                            : "#FB7185"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <CardHeader
              title="Tích luỹ tiết kiệm"
              subtitle="Tổng tiết kiệm cộng dồn qua 12 tháng"
            />
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart
                data={monthlyData.map((m, i) => ({
                  ...m,
                  cumulative: monthlyData
                    .slice(0, i + 1)
                    .reduce((s, x) => s + x.saving, 0),
                }))}
              >
                <defs>
                  <linearGradient id="gCumul" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#F3F4F6"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v: number) => formatCompact(v)}
                  tick={{ fontSize: 10, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                />
                <ReferenceLine y={0} stroke="#E5E7EB" />
                <Tooltip
                  formatter={(v: unknown) => [
                    formatCurrency(Number(v)),
                    "Tích luỹ",
                  ]}
                  contentStyle={{ borderRadius: "10px", fontSize: "12px" }}
                />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#4F46E5"
                  strokeWidth={2.5}
                  fill="url(#gCumul)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
              <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wide mb-1">
                🏆 Tháng tốt nhất
              </p>
              <p className="text-xl font-bold text-emerald-700">
                {totals.bestMonth?.label}
              </p>
              <p className="text-sm text-emerald-600">
                Tiết kiệm {formatCompact(totals.bestMonth?.saving ?? 0)}
              </p>
              <p className="text-xs text-emerald-500">
                Tỷ lệ: {totals.bestMonth?.savingRate ?? 0}%
              </p>
            </div>
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4">
              <p className="text-[11px] font-semibold text-rose-600 uppercase tracking-wide mb-1">
                📉 Tháng khó nhất
              </p>
              <p className="text-xl font-bold text-rose-700">
                {totals.worstMonth?.label}
              </p>
              <p className="text-sm text-rose-600">
                {totals.worstMonth && totals.worstMonth.saving < 0
                  ? `Thâm hụt ${formatCompact(Math.abs(totals.worstMonth.saving))}`
                  : `Tiết kiệm ${formatCompact(totals.worstMonth?.saving ?? 0)}`}
              </p>
              <p className="text-xs text-rose-500">
                Tỷ lệ: {totals.worstMonth?.savingRate ?? 0}%
              </p>
            </div>
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
              <p className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wide mb-1">
                📊 Trung bình
              </p>
              <p className="text-xl font-bold text-indigo-700">
                {totals.savingRate}%
              </p>
              <p className="text-sm text-indigo-600">
                {totals.savingRate >= 20
                  ? "✅ Đạt mục tiêu 20%"
                  : "⚠️ Chưa đạt mục tiêu"}
              </p>
              <p className="text-xs text-indigo-500">Mục tiêu: ≥ 20%</p>
            </div>
          </div>
        </div>
      )}

      {activeSection === "table" && hasData && (
        <Card padding="none">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Chi tiết từng tháng</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              12 tháng gần nhất — nhấn hàng để xem giao dịch
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                    Tháng
                  </th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                    Thu nhập
                  </th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                    Chi tiêu
                  </th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                    Tiết kiệm
                  </th>
                  <th className="text-right px-6 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                    Tỷ lệ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[...monthlyData].reverse().map((m) => {
                  const isCurrentM =
                    m.monthNum === currentMonth && m.yearNum === currentYear;
                  return (
                    <tr
                      key={`${m.yearNum}-${m.monthNum}`}
                      className={cn(
                        "transition-colors hover:bg-gray-50",
                        isCurrentM && "bg-indigo-50/50",
                      )}
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">
                            Tháng {m.monthNum}/{m.yearNum}
                          </span>
                          {isCurrentM && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-600 uppercase">
                              Hiện tại
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-emerald-600 font-semibold">
                          {m.income > 0 ? `+${formatCompact(m.income)}` : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-rose-500 font-semibold">
                          {m.expense > 0 ? `−${formatCompact(m.expense)}` : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span
                          className={cn(
                            "font-semibold",
                            m.saving >= 0 ? "text-indigo-600" : "text-rose-600",
                          )}
                        >
                          {m.income === 0 && m.expense === 0
                            ? "—"
                            : `${m.saving >= 0 ? "+" : "−"}${formatCompact(Math.abs(m.saving))}`}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold",
                            m.savingRate >= 20
                              ? "bg-emerald-100 text-emerald-700"
                              : m.savingRate >= 0
                                ? "bg-amber-100 text-amber-700"
                                : "bg-rose-100 text-rose-700",
                          )}
                        >
                          {m.income === 0 && m.expense === 0
                            ? "—"
                            : `${m.savingRate}%`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50">
                  <td className="px-6 py-3.5 text-sm font-bold text-gray-800">
                    Tổng 12 tháng
                  </td>
                  <td className="px-4 py-3.5 text-right text-sm font-bold text-emerald-600">
                    +{formatCompact(totals.income)}
                  </td>
                  <td className="px-4 py-3.5 text-right text-sm font-bold text-rose-500">
                    −{formatCompact(totals.expense)}
                  </td>
                  <td className="px-4 py-3.5 text-right text-sm font-bold text-indigo-600">
                    {totals.saving >= 0 ? "+" : "−"}
                    {formatCompact(Math.abs(totals.saving))}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold",
                        totals.savingRate >= 20
                          ? "bg-emerald-100 text-emerald-700"
                          : totals.savingRate >= 0
                            ? "bg-amber-100 text-amber-700"
                            : "bg-rose-100 text-rose-700",
                      )}
                    >
                      {totals.savingRate}%
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
