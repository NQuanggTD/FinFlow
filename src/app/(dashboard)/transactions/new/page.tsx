import type { Metadata } from "next";
export const metadata: Metadata = { title: "Thêm giao dịch – FinFlow" };

import { createClient }    from "@/lib/supabase/server";
import { redirect }        from "next/navigation";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import type { CategoryRow, AccountRow } from "@/types/database";
import Link from "next/link";

export default async function NewTransactionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [{ data: catsData }, { data: accsData }] = await Promise.all([
    (supabase.from("categories") as any).select("id, name, icon, type").order("name"),
    (supabase.from("accounts")   as any).select("id, name, balance, type").eq("user_id", user.id).eq("is_active", true).order("created_at"),
  ]);

  const categories = (catsData  ?? []) as Pick<CategoryRow, "id" | "name" | "icon" | "type">[];
  const accounts   = (accsData  ?? []) as Pick<AccountRow,  "id" | "name" | "balance">[];

  if (accounts.length === 0) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Thêm giao dịch</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center space-y-3">
          <p className="text-3xl">⚠️</p>
          <p className="font-semibold text-amber-800">Chưa có tài khoản nào</p>
          <p className="text-sm text-amber-600">
            Vui lòng tạo ít nhất một tài khoản (ngân hàng, tiền mặt...) trước khi ghi giao dịch.
          </p>
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
          >
            ⚙️ Đến trang Cài đặt
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/transactions" className="text-gray-400 hover:text-gray-600 transition-colors">
          ← Quay lại
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thêm giao dịch</h1>
          <p className="text-gray-500 text-sm">Ghi lại thu nhập hoặc chi tiêu của bạn</p>
        </div>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <TransactionForm categories={categories} accounts={accounts} />
      </div>
    </div>
  );
}
