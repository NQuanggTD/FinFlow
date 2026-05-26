"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { AccountRow } from "@/types/database";

export function useAccounts() {
  const supabase = createClient();

  return useQuery<AccountRow[]>({
    queryKey: ["accounts"],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("accounts") as any)
        .select("*")
        .eq("is_active", true)
        .order("created_at");
      if (error) throw new Error(error.message);
      return (data ?? []) as AccountRow[];
    },
  });
}

export function useTotalBalance() {
  const { data: accounts } = useAccounts();
  return accounts?.reduce((s, a) => s + a.balance, 0) ?? 0;
}
