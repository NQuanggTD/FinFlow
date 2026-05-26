"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient }      from "@/lib/supabase/client";
import { depositToGoalAction } from "@/actions/goals";
import type { GoalRow }      from "@/types/database";

export function useGoals() {
  const supabase = createClient();

  return useQuery<GoalRow[]>({
    queryKey: ["goals"],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("goals") as any)
        .select("*")
        .order("priority", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as GoalRow[];
    },
  });
}

export function useDepositGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ goalId, amount }: { goalId: string; amount: number }) =>
      depositToGoalAction(goalId, amount),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}
