"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { TransactionRow, CategoryRow, AccountRow } from "@/types/database";

export type TransactionWithRelations = TransactionRow & {
  categories: Pick<CategoryRow, "name" | "icon" | "color"> | null;
  accounts:   Pick<AccountRow,  "name"> | null;
};

function getMonthRange(month: number, year: number) {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end   = new Date(year, month, 0).toISOString().split("T")[0];
  return { start, end };
}

export function useTransactions(month: number, year: number) {
  const supabase = createClient();
  const { start, end } = getMonthRange(month, year);

  return useQuery<TransactionWithRelations[]>({
    queryKey: ["transactions", month, year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*, categories(name,icon,color), accounts(name)")
        .eq("is_deleted", false)
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: false });

      if (error) throw new Error(error.message);
      return (data ?? []) as TransactionWithRelations[];
    },
  });
}

export function useDashboardSummary(month: number, year: number) {
  const supabase = createClient();
  const { start, end } = getMonthRange(month, year);

  return useQuery({
    queryKey: ["dashboard-summary", month, year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("amount, type")
        .eq("is_deleted", false)
        .gte("date", start)
        .lte("date", end);

      if (error) throw new Error(error.message);

      const rows = (data ?? []) as Array<{ amount: number; type: string }>;
      const monthlyIncome  = rows.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
      const monthlyExpense = rows.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

      return {
        monthlyIncome,
        monthlyExpense,
        monthlySaving: monthlyIncome - monthlyExpense,
        savingRate: monthlyIncome > 0 ? ((monthlyIncome - monthlyExpense) / monthlyIncome) * 100 : 0,
      };
    },
  });
}
