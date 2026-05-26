"use server";

import { createClient }   from "@/lib/supabase/server";
import { budgetSchema }   from "@/lib/validations/budget";
import { revalidatePath } from "next/cache";

export async function upsertBudgetAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Chưa đăng nhập" };

  const raw = {
    category_id:      formData.get("category_id")      as string,
    amount_limit:     Number(formData.get("amount_limit")),
    month:            Number(formData.get("month")),
    year:             Number(formData.get("year")),
    alert_at_percent: Number(formData.get("alert_at_percent") ?? 80),
  };

  const parsed = budgetSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Check if a budget already exists for this user/category/month/year
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase.from("budgets") as any)
    .select("id")
    .eq("user_id",     user.id)
    .eq("category_id", parsed.data.category_id)
    .eq("month",       parsed.data.month)
    .eq("year",        parsed.data.year)
    .maybeSingle();

  let error;
  if (existing) {
    // Update existing budget
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ error } = await (supabase.from("budgets") as any)
      .update({
        amount_limit:     parsed.data.amount_limit,
        alert_at_percent: parsed.data.alert_at_percent,
      })
      .eq("id", (existing as { id: string }).id));
  } else {
    // Insert new budget
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ error } = await (supabase.from("budgets") as any)
      .insert({
        user_id:          user.id,
        category_id:      parsed.data.category_id,
        amount_limit:     parsed.data.amount_limit,
        month:            parsed.data.month,
        year:             parsed.data.year,
        alert_at_percent: parsed.data.alert_at_percent,
      }));
  }

  if (error) return { error: "Không thể lưu ngân sách: " + (error as { message: string }).message };
  revalidatePath("/budgets");
  return { success: true };
}

export async function deleteBudgetAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Chưa đăng nhập" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("budgets") as any)
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: "Không thể xóa ngân sách" };
  revalidatePath("/budgets");
  return { success: true };
}
