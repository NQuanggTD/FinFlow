import type { Metadata } from "next";
export const metadata: Metadata = { title: "Dashboard – FinFlow" };

import { createClient }    from "@/lib/supabase/server";
import { DashboardShell }  from "@/components/dashboard/DashboardShell";
import type { FlowScoreRow } from "@/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const [{ data: scoreData }, { data: accData }, { data: txData }] = await Promise.all([
    sb.from("flow_scores").select("score").eq("user_id", user!.id)
      .order("calculated_at", { ascending: false }).limit(1),
    sb.from("accounts").select("id").eq("user_id", user!.id).eq("is_active", true).limit(1),
    sb.from("transactions").select("id").eq("user_id", user!.id).eq("is_deleted", false).limit(1),
  ]);

  const score          = ((scoreData ?? []) as Pick<FlowScoreRow,"score">[])[0]?.score ?? 0;
  const hasAccounts    = ((accData ?? []) as unknown[]).length > 0;
  const hasTransactions = ((txData ?? []) as unknown[]).length > 0;

  return (
    <DashboardShell
      userId={user!.id}
      flowScore={score}
      hasAccounts={hasAccounts}
      hasTransactions={hasTransactions}
    />
  );
}
