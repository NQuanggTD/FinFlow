import type { Metadata } from "next";
export const metadata: Metadata = { title: "Giao dịch – FinFlow" };

import { createClient }    from "@/lib/supabase/server";
import { TransactionList } from "@/components/transactions/TransactionList";
import type { TransactionWithRelations } from "@/hooks/useTransactions";
import Link from "next/link";

export default async function TransactionsPage() {
  const supabase = await createClient();
  const now   = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end   = new Date(year, month, 0).toISOString().split("T")[0];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from("transactions") as any)
    .select("*, categories(name,icon,color), accounts(name)")
    .eq("is_deleted", false)
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: false });

  const transactions = (data ?? []) as TransactionWithRelations[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Giao dịch</h1>
          <p className="text-gray-500 text-sm mt-0.5">Tháng {month}/{year}</p>
        </div>
        <Link
          href="/transactions/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
        >
          ＋ Thêm giao dịch
        </Link>
      </div>
      <TransactionList initialData={transactions} month={month} year={year} />
    </div>
  );
}
