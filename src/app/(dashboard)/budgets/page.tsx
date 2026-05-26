import type { Metadata } from "next";
export const metadata: Metadata = { title: "Ngân sách – FinFlow" };

import { BudgetList } from "@/components/budgets/BudgetList";

export default function BudgetsPage() {
  const now = new Date();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ngân sách</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Kiểm soát chi tiêu theo danh mục mỗi tháng
        </p>
      </div>
      <BudgetList month={now.getMonth() + 1} year={now.getFullYear()} />
    </div>
  );
}
