"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils/format";
import type { TransactionWithRelations } from "@/hooks/useTransactions";

const COLORS = [
  "#4F46E5",
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
];

interface Props {
  transactions: TransactionWithRelations[];
}

// (removed unused renderLabel)

export function CategoryPieChart({ transactions }: Props) {
  const grouped: Record<string, number> = {};
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      const name = t.categories?.name ?? "Khác";
      grouped[name] = (grouped[name] ?? 0) + t.amount;
    });

  const total = Object.values(grouped).reduce((s, v) => s + v, 0);
  const data = Object.entries(grouped)
    .map(([name, value]) => ({
      name,
      value,
      pct: total > 0 ? ((value / total) * 100).toFixed(1) : "0",
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <div
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
      suppressHydrationWarning
    >
      <h3 className="font-semibold text-gray-900 mb-4">Phân bổ chi tiêu</h3>

      {data.length === 0 ? (
        <div
          className="h-52 flex items-center justify-center text-gray-400 text-sm"
          suppressHydrationWarning
        >
          Chưa có dữ liệu chi tiêu
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={210}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => formatCurrency(Number(value))}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #E5E7EB",
                fontSize: "13px",
              }}
            />
            <Legend
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: string, entry: any) =>
                `${value} (${(entry?.payload as { pct?: string })?.pct ?? 0}%)`
              }
              wrapperStyle={{ fontSize: "11px" }}
              iconType="circle"
              iconSize={8}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
