import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReportsShell } from "@/components/reports/ReportsShell";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Báo cáo – FinFlow" };

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Báo cáo tài chính</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Phân tích chi tiết thu chi — 12 tháng gần nhất
        </p>
      </div>
      <ReportsShell
        userId={user.id}
        currentMonth={now.getMonth() + 1}
        currentYear={now.getFullYear()}
      />
    </div>
  );
}