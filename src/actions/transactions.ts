"use server";

import { createClient } from "@/lib/supabase/server";
import { transactionSchema } from "@/lib/validations/transaction";
import { revalidatePath } from "next/cache";
import type { BudgetAlert } from "@/types/budget";

export async function createTransactionAction(
  formData: FormData,
): Promise<{ error: string } | { success: true; budgetAlert?: BudgetAlert }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Chưa đăng nhập" };

  const raw = {
    account_id: formData.get("account_id") as string,
    category_id: formData.get("category_id") as string,
    amount: Number(formData.get("amount")),
    type: formData.get("type") as "income" | "expense",
    note: (formData.get("note") as string) || undefined,
    date: formData.get("date") as string,
    is_recurring: formData.get("is_recurring") === "true",
  };

  const parsed = transactionSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("transactions") as any).insert({
    account_id: parsed.data.account_id,
    category_id: parsed.data.category_id,
    amount: parsed.data.amount,
    type: parsed.data.type,
    note: parsed.data.note ?? null,
    date: parsed.data.date,
    is_recurring: parsed.data.is_recurring,
    user_id: user.id,
    is_deleted: false,
    receipt_url: (formData.get("receipt_url") as string) || null,
  });

  if (error)
    return {
      error:
        "Không thể tạo giao dịch: " + (error as { message: string }).message,
    };

  const delta =
    parsed.data.type === "income" ? parsed.data.amount : -parsed.data.amount;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: acc } = await (supabase.from("accounts") as any)
    .select("balance")
    .eq("id", parsed.data.account_id)
    .single();
  if (acc) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("accounts") as any)
      .update({ balance: (acc as { balance: number }).balance + delta })
      .eq("id", parsed.data.account_id);
  }

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/budgets");

  if (parsed.data.type !== "expense") return { success: true };

  const txDate = new Date(parsed.data.date);
  const month = txDate.getMonth() + 1;
  const year = txDate.getFullYear();
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = new Date(year, month, 0).toISOString().split("T")[0];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: budget } = await (supabase.from("budgets") as any)
    .select("id, amount_limit, alert_at_percent, categories(name, icon)")
    .eq("category_id", parsed.data.category_id)
    .eq("month", month)
    .eq("year", year)
    .single();

  if (!budget) return { success: true };

  const bRow = budget as {
    id: string;
    amount_limit: number;
    alert_at_percent: number;
    categories: { name: string; icon: string } | null;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: spentRows } = await (supabase.from("transactions") as any)
    .select("amount")
    .eq("category_id", parsed.data.category_id)
    .eq("type", "expense")
    .eq("is_deleted", false)
    .gte("date", start)
    .lte("date", end);

  const spent = ((spentRows ?? []) as Array<{ amount: number }>).reduce(
    (sum, row) => sum + row.amount,
    0,
  );
  const percentage =
    bRow.amount_limit > 0 ? (spent / bRow.amount_limit) * 100 : 0;
  const isExceeded = percentage >= 100;
  const isNearLimit = percentage >= bRow.alert_at_percent && !isExceeded;

  if (!isExceeded && !isNearLimit) return { success: true };

  return {
    success: true,
    budgetAlert: {
      categoryName: bRow.categories?.name ?? "Danh mục",
      categoryIcon: bRow.categories?.icon ?? "💳",
      spent,
      limit: bRow.amount_limit,
      percentage: Math.round(percentage),
      alertPercent: bRow.alert_at_percent,
      isExceeded,
    },
  };
}

export async function updateTransactionAction(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Chưa đăng nhập" };

  const raw = {
    account_id: formData.get("account_id") as string,
    category_id: formData.get("category_id") as string,
    amount: Number(formData.get("amount")),
    type: formData.get("type") as "income" | "expense",
    note: (formData.get("note") as string) || undefined,
    date: formData.get("date") as string,
    is_recurring: formData.get("is_recurring") === "true",
  };

  const parsed = transactionSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: oldTx } = await (supabase.from("transactions") as any)
    .select("amount, type, account_id")
    .eq("id", id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("transactions") as any)
    .update({
      account_id: parsed.data.account_id,
      category_id: parsed.data.category_id,
      amount: parsed.data.amount,
      type: parsed.data.type,
      note: parsed.data.note ?? null,
      date: parsed.data.date,
      is_recurring: parsed.data.is_recurring,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error)
    return {
      error:
        "Không thể cập nhật giao dịch: " +
        (error as { message: string }).message,
    };

  if (oldTx) {
    const old = oldTx as { amount: number; type: string; account_id: string };
    const oldDelta = old.type === "income" ? -old.amount : old.amount;
    const newDelta =
      parsed.data.type === "income" ? parsed.data.amount : -parsed.data.amount;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: acct } = await (supabase.from("accounts") as any)
      .select("balance")
      .eq("id", old.account_id)
      .single();
    if (acct) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("accounts") as any)
        .update({
          balance: (acct as { balance: number }).balance + oldDelta + newDelta,
        })
        .eq("id", old.account_id);
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/budgets");
  return { success: true };
}

export async function deleteTransactionAction(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Chưa đăng nhập" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tx } = await (supabase.from("transactions") as any)
    .select("amount, type, account_id")
    .eq("id", id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("transactions") as any)
    .update({ is_deleted: true })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: "Không thể xóa giao dịch" };

  if (tx) {
    const t = tx as { amount: number; type: string; account_id: string };
    const delta = t.type === "income" ? -t.amount : t.amount;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: acct } = await (supabase.from("accounts") as any)
      .select("balance")
      .eq("id", t.account_id)
      .single();
    if (acct) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("accounts") as any)
        .update({ balance: (acct as { balance: number }).balance + delta })
        .eq("id", t.account_id);
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/budgets");
  return { success: true };
}
