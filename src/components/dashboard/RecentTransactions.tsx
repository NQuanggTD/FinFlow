"use client";

import Link from "next/link";
import { formatCurrency, formatRelative } from "@/lib/utils/format";
import type { TransactionWithRelations }  from "@/hooks/useTransactions";

interface Props { transactions: TransactionWithRelations[]; }

export function RecentTransactions({ transactions }: Props) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Giao dịch gần đây</h3>
        <Link href="/transactions" className="text-xs text-indigo-600 hover:underline font-medium">
          Xem tất cả →
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-gray-400">
          <span className="text-3xl mb-2">💳</span>
          <p className="text-sm">Chưa có giao dịch nào trong tháng này</p>
          <Link href="/transactions/new" className="mt-3 text-xs text-indigo-600 font-medium hover:underline">
            ＋ Thêm giao dịch đầu tiên
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {transactions.map((t) => (
            <div key={t.id} className="flex items-center gap-3 py-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors">
              {/* Category icon */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
                style={{ backgroundColor: (t.categories?.color ?? "#6B7280") + "22" }}
              >
                {t.categories?.icon ?? "💳"}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {t.categories?.name ?? "Khác"}
                </p>
                <p className="text-xs text-gray-400">
                  {formatRelative(t.date)}
                  {t.note && ` · ${t.note}`}
                </p>
              </div>

              {/* Amount */}
              <span className={`text-sm font-semibold flex-shrink-0 ${t.type === "income" ? "text-green-600" : "text-red-500"}`}>
                {t.type === "income" ? "+" : "−"}{formatCurrency(t.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
