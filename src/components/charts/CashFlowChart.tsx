"use client";

import { useMemo } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { formatCurrency } from "@/lib/utils/format";
import { Skeleton }        from "@/components/ui/Skeleton";

interface Props { month: number; year: number; }

// Vietnamese short day names, starting Monday
const DAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
// Map JS getDay() (0=Sun … 6=Sat) → index in DAY_LABELS (Mon=0 … Sun=6)
const JS_DAY_TO_IDX: Record<number, number> = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6 };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const income  = payload.find((p: { name: string; value: number }) => p.name === "income")?.value  ?? 0;
  const expense = payload.find((p: { name: string; value: number }) => p.name === "expense")?.value ?? 0;
  const net     = income - expense;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm min-w-[160px]">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {income  > 0 && <p className="text-emerald-600">↑ Thu: {formatCurrency(income)}</p>}
      {expense > 0 && <p className="text-rose-500">↓ Chi: {formatCurrency(expense)}</p>}
      <p className={`font-semibold mt-1 pt-1 border-t border-gray-100 ${net >= 0 ? "text-indigo-600" : "text-rose-600"}`}>
        {net >= 0 ? "+" : "−"}{formatCurrency(Math.abs(net))}
      </p>
    </div>
  );
};

export function CashFlowChart({ month, year }: Props) {
  const { data: transactions, isLoading } = useTransactions(month, year);

  // Aggregate income & expense by day-of-week across the whole month
  const data = useMemo(() => {
    const buckets = DAY_LABELS.map((name) => ({ name, income: 0, expense: 0 }));

    (transactions ?? []).forEach((t) => {
      const dow = new Date(t.date).getDay();
      const idx = JS_DAY_TO_IDX[dow];
      if (t.type === "income")  buckets[idx].income  += t.amount;
      if (t.type === "expense") buckets[idx].expense += t.amount;
    });

    return buckets;
  }, [transactions]);

  const hasData = data.some((d) => d.income > 0 || d.expense > 0);

  // Highest single bar value — for reference line
  const maxVal = Math.max(...data.flatMap((d) => [d.income, d.expense]), 0);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <Skeleton className="h-4 w-48 mb-4" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-gray-900 text-[15px]">Dòng tiền theo ngày trong tuần</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Tổng thu / chi tháng {month}/{year} — phân theo thứ
          </p>
        </div>
      </div>

      {!hasData ? (
        <div className="h-56 flex flex-col items-center justify-center text-gray-400 gap-2">
          <span className="text-3xl">📊</span>
          <p className="text-sm">Chưa có dữ liệu giao dịch</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} barGap={3} barCategoryGap="28%">
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: "#6B7280", fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v: number) =>
                v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}M`
                : v >= 1_000   ? `${(v / 1_000).toFixed(0)}K`
                : String(v)
              }
              tick={{ fontSize: 11, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
              width={42}
            />
            {maxVal > 0 && (
              <ReferenceLine
                y={maxVal}
                stroke="#E5E7EB"
                strokeDasharray="4 4"
              />
            )}
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F9FAFB", radius: 6 }} />
            <Legend
              wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
              formatter={(value) => value === "income" ? "Thu nhập" : "Chi tiêu"}
            />
            <Bar
              dataKey="income"
              name="income"
              fill="#4F46E5"
              radius={[5, 5, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              dataKey="expense"
              name="expense"
              fill="#FB7185"
              radius={[5, 5, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}