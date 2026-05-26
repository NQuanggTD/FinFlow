"use client";

import { useEffect, useRef }   from "react";
import { createClient }        from "@/lib/supabase/client";
import { useQueryClient }      from "@tanstack/react-query";

type Table = "transactions" | "budgets" | "goals" | "accounts";

export function useRealtimeTable(userId: string, tables: Table[]) {
  const queryClient = useQueryClient();
  const supabaseRef = useRef(createClient());
  const channelsRef = useRef<ReturnType<typeof supabaseRef.current.channel>[]>([]);
  // Keep a stable ref to the tables array so the effect doesn't re-subscribe on every render
  const tablesRef = useRef(tables);

  useEffect(() => {
    if (!userId) return;
    const supabase = supabaseRef.current;

    // Remove previous channels
    channelsRef.current.forEach(ch => supabase.removeChannel(ch));
    channelsRef.current = [];

    tablesRef.current.forEach(table => {
      const queryKeyMap: Record<Table, string[]> = {
        transactions: ["transactions", "dashboard-summary"],
        budgets:      ["budgets-usage"],
        goals:        ["goals"],
        accounts:     ["accounts"],
      };

      const ch = supabase
        .channel(`realtime-${table}-${userId}`)
        .on("postgres_changes",
          { event: "*", schema: "public", table, filter: `user_id=eq.${userId}` },
          () => {
            queryKeyMap[table].forEach(key =>
              void queryClient.invalidateQueries({ queryKey: [key] })
            );
          }
        )
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR")
            console.warn(`Realtime ${table} channel error`);
        });

      channelsRef.current.push(ch);
    });

    return () => {
      channelsRef.current.forEach(ch => supabase.removeChannel(ch));
      channelsRef.current = [];
    };
  }, [userId, queryClient]);
}

// Convenience hook for all tables at once
export function useRealtimeTransactions(userId: string) {
  useRealtimeTable(userId, ["transactions"]);
}

export function useRealtimeAll(userId: string) {
  useRealtimeTable(userId, ["transactions", "budgets", "goals", "accounts"]);
}
