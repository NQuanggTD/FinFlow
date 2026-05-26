import type { Metadata } from "next";
export const metadata: Metadata = { title: "Mục tiêu – FinFlow" };

import { createClient } from "@/lib/supabase/server";
import { GoalList }     from "@/components/goals/GoalList";
import type { GoalRow } from "@/types/database";
import Link from "next/link";

export default async function GoalsPage() {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from("goals") as any)
    .select("*")
    .order("priority", { ascending: false });

  const goals = (data ?? []) as GoalRow[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mục tiêu tiết kiệm</h1>
          <p className="text-gray-500 text-sm mt-0.5">{goals.length} mục tiêu đang theo dõi</p>
        </div>
        <Link
          href="/goals/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
        >
          ＋ Thêm mục tiêu
        </Link>
      </div>
      <GoalList goals={goals} />
    </div>
  );
}
