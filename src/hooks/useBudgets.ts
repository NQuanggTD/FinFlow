"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { BudgetWithUsage } from "@/types";
import type { BudgetRow, CategoryRow } from "@/types/database";

type BudgetWithCategory = BudgetRow & {
  categories: Pick<CategoryRow, "name" | "icon" | "color"> | null;
};

export function useBudgetsWithUsage(month: number, year: number) {
  const supabase = createClient();
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end   = new Date(year, month, 0).toISOString().split("T")[0];

  return useQuery<BudgetWithUsage[]>({
    queryKey: ["budgets-usage", month, year],
    queryFn: async () => {
      // Fetch budgets + categories in one query
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: budgets, error } = await (supabase.from("budgets") as any)
        .select("*, categories(name,icon,color)")
        .eq("month", month)
        .eq("year",  year);

      if (error) throw new Error(error.message);
      if (!budgets || (budgets as unknown[]).length === 0) return [];

      const bList = budgets as BudgetWithCategory[];

      // Fetch ALL expense transactions for this month in ONE query
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: txs } = await (supabase.from("transactions") as any)
        .select("category_id, amount")
        .eq("type",       "expense")
        .eq("is_deleted", false)
        .gte("date", start)
        .lte("date", end);

      // Build a map: category_id → total spent
      const spentMap: Record<string, number> = {};
      ((txs ?? []) as Array<{ category_id: string; amount: number }>)
        .forEach(t => {
          spentMap[t.category_id] = (spentMap[t.category_id] ?? 0) + t.amount;
        });

      return bList.map((b) => {
        const spent = spentMap[b.category_id] ?? 0;
        return {
          id:               b.id,
          category_id:      b.category_id,
          category_name:    b.categories?.name  ?? "",
          category_icon:    b.categories?.icon  ?? "💳",
          category_color:   b.categories?.color ?? "#6B7280",
          amount_limit:     b.amount_limit,
          spent,
          remaining:        b.amount_limit - spent,
          percentage:       b.amount_limit > 0 ? Math.min((spent / b.amount_limit) * 100, 100) : 0,
          alert_at_percent: b.alert_at_percent,
        } satisfies BudgetWithUsage;
      });
    },
  });
}
