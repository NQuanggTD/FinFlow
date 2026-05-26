"use client";

import { useRouter } from "next/navigation";
import { GoalCard }  from "./GoalCard";
import { EmptyState } from "@/components/ui/EmptyState";
import type { GoalRow } from "@/types/database";

export function GoalList({ goals }: { goals: GoalRow[] }) {
  const router = useRouter();

  if (goals.length === 0) {
    return (
      <EmptyState
        icon="⭐"
        title="Chưa có mục tiêu nào"
        description="Đặt mục tiêu tiết kiệm để theo dõi tiến độ và có thêm động lực!"
        actionLabel="Tạo mục tiêu đầu tiên"
        onAction={() => router.push("/goals/new")}
      />
    );
  }

  const active    = goals.filter((g) => g.status === "active");
  const paused    = goals.filter((g) => g.status === "paused");
  const completed = goals.filter((g) => g.status === "completed");

  return (
    <div className="space-y-8">
      {active.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            Đang thực hiện ({active.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {active.map((g) => <GoalCard key={g.id} goal={g} />)}
          </div>
        </section>
      )}

      {paused.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            Tạm dừng ({paused.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {paused.map((g) => <GoalCard key={g.id} goal={g} />)}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
            Đã hoàn thành 🎉 ({completed.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {completed.map((g) => <GoalCard key={g.id} goal={g} completed />)}
          </div>
        </section>
      )}
    </div>
  );
}
