import { createClient } from "@/lib/supabase/server";
import { NextResponse }  from "next/server";

/**
 * POST /api/flow-score
 * Calculates and stores the current user's Flow Score.
 * Score (0-100):
 *   Saving rate     40 pts  = (income-expense)/income × 40
 *   Budget adherence 35 pts = avg % budgets not exceeded
 *   Goal progress   25 pts  = avg % active goals completed
 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb    = supabase as any;
  const now   = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();
  const start = `${year}-${String(month).padStart(2,"0")}-01`;
  const end   = new Date(year, month, 0).toISOString().split("T")[0];

  // ── Saving rate ─────────────────────────────────────
  const { data: txs } = await sb.from("transactions")
    .select("amount,type").eq("user_id", user.id)
    .eq("is_deleted", false).gte("date", start).lte("date", end);

  const rows    = (txs ?? []) as Array<{ amount: number; type: string }>;
  const income  = rows.filter(t => t.type==="income").reduce((s,t)=>s+t.amount,0);
  const expense = rows.filter(t => t.type==="expense").reduce((s,t)=>s+t.amount,0);
  const saving_rate = income > 0 ? Math.min(((income-expense)/income)*100, 100) : 0;
  const savingScore = (saving_rate/100)*40;

  // ── Budget adherence ─────────────────────────────────
  const { data: budgets } = await sb.from("budgets")
    .select("category_id,amount_limit").eq("user_id", user.id)
    .eq("month", month).eq("year", year);

  let budget_adherence = 100;
  const bList = (budgets ?? []) as Array<{ category_id: string; amount_limit: number }>;
  if (bList.length > 0) {
    const adh = await Promise.all(bList.map(async (b) => {
      const { data: bTxs } = await sb.from("transactions")
        .select("amount").eq("category_id", b.category_id).eq("type","expense")
        .eq("is_deleted",false).gte("date",start).lte("date",end);
      const spent = ((bTxs??[]) as Array<{amount:number}>).reduce((s,t)=>s+t.amount,0);
      const pct   = b.amount_limit > 0 ? (spent/b.amount_limit)*100 : 0;
      return Math.max(0, 100 - Math.max(0, pct - 100));
    }));
    budget_adherence = adh.reduce((s,a)=>s+a,0) / adh.length;
  }
  const budgetScore = (budget_adherence/100)*35;

  // ── Goal progress ───────────────────────────────────
  const { data: goals } = await sb.from("goals")
    .select("current_amount,target_amount").eq("user_id", user.id).eq("status","active");
  const gList = (goals??[]) as Array<{current_amount:number;target_amount:number}>;
  const goal_progress = gList.length > 0
    ? gList.map(g=>g.target_amount>0?Math.min((g.current_amount/g.target_amount)*100,100):0)
           .reduce((s,p)=>s+p,0) / gList.length
    : 0;
  const goalScore = (goal_progress/100)*25;

  const score = Math.round(savingScore + budgetScore + goalScore);

  await sb.from("flow_scores").insert({
    user_id: user.id, score, saving_rate, budget_adherence, goal_progress,
  });

  return NextResponse.json({ score, saving_rate, budget_adherence, goal_progress });
}
