"use client";

import { useTransactions } from "@/hooks/useTransactions";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils/format";
import { Skeleton } from "@/components/ui/Skeleton";

interface Props { month: number; year: number; }

export function CashFlowChart({ month, year }: Props) {
  const { data: transactions, isLoading } = useTransactions(month, year);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-52 w-full" />
      </div>
    );
  }

  const weeks: Record<number, { income: number; expense: number }> = {
    1: { income: 0, expense: 0 },
    2: { income: 0, expense: 0 },
    3: { income: 0, expense: 0 },
    4: { income: 0, expense: 0 },
  };

  (transactions ?? []).forEach((t) => {
    const day  = new Date(t.date).getDate();
    const week = Math.min(Math.ceil(day / 7), 4) as 1 | 2 | 3 | 4;
    if (t.type === "income")  weeks[week].income  += t.amount;
    if (t.type === "expense") weeks[week].expense += t.amount;
  });

  const data = Object.entries(weeks).map(([w, v]) => ({ name: `Tuần ${w}`, ...v }));
  const hasData = data.some((d) => d.income > 0 || d.expense > 0);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Dòng tiền theo tuần</h3>
        <span className="text-xs text-gray-400">Tháng {month}/{year}</span>
      </div>

      {!hasData ? (
        <div className="h-52 flex items-center justify-center text-gray-400 text-sm">
          Chưa có dữ liệu giao dịch
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={data} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={(v: number) => `${(v / 1e6).toFixed(1)}M`}
              tick={{ fontSize: 11, fill: "#9CA3AF" }}
              axisLine={false} tickLine={false}
            />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => formatCurrency(Number(value))}
              contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "13px" }}
              cursor={{ fill: "#F9FAFB" }}
            />
            <Legend
              wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
              formatter={(value) => value === "income" ? "Thu nhập" : "Chi tiêu"}
            />
            <Bar dataKey="income"  name="income"  fill="#4F46E5" radius={[4,4,0,0]} maxBarSize={36} />
            <Bar dataKey="expense" name="expense" fill="#F87171" radius={[4,4,0,0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
