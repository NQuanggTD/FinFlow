"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { TransactionRow, CategoryRow, AccountRow } from "@/types/database";

export type TransactionWithRelations = TransactionRow & {
  categories: Pick<CategoryRow, "name" | "icon" | "color"> | null;
  accounts:   Pick<AccountRow,  "name"> | null;
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function getMonthRange(month: number, year: number) {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end   = new Date(year, month, 0).toISOString().split("T")[0];
  return { start, end };
}

/** Return the Monday and Sunday of the ISO week that contains `date` */
export function getWeekRange(date: Date): { start: string; end: string } {
  const d   = new Date(date);
  const day = d.getDay(); // 0 = Sun
  // Shift so Monday = 0
  const diffToMon = (day === 0 ? -6 : 1 - day);
  const mon = new Date(d);
  mon.setDate(d.getDate() + diffToMon);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (dt: Date) => dt.toISOString().split("T")[0];
  return { start: fmt(mon), end: fmt(sun) };
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

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

/**
 * Fetch transactions for any arbitrary date range.
 * Used by comparison charts and other range-based analytics.
 */
export function useTransactionsByRange(start: string, end: string, enabled = true) {
  const supabase = createClient();

  return useQuery<TransactionWithRelations[]>({
    queryKey: ["transactions-range", start, end],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*, categories(name,icon,color), accounts(name)")
        .eq("is_deleted", false)
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: true });

      if (error) throw new Error(error.message);
      return (data ?? []) as TransactionWithRelations[];
    },
  });
}

/** Light-weight summary (no joins) for a month — used by dashboard summary cards */
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