"use server";

import { createClient }        from "@/lib/supabase/server";
import { transactionSchema }   from "@/lib/validations/transaction";
import { revalidatePath }      from "next/cache";

export async function createTransactionAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Chưa đăng nhập" };

  const raw = {
    account_id:   formData.get("account_id")  as string,
    category_id:  formData.get("category_id") as string,
    amount:       Number(formData.get("amount")),
    type:         formData.get("type")         as "income" | "expense",
    note:         (formData.get("note")        as string) || undefined,
    date:         formData.get("date")         as string,
    is_recurring: formData.get("is_recurring") === "true",
  };

  const parsed = transactionSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("transactions") as any).insert({
    account_id:   parsed.data.account_id,
    category_id:  parsed.data.category_id,
    amount:       parsed.data.amount,
    type:         parsed.data.type,
    note:         parsed.data.note ?? null,
    date:         parsed.data.date,
    is_recurring: parsed.data.is_recurring,
    user_id:      user.id,
    is_deleted:   false,
    receipt_url:  (formData.get("receipt_url") as string) || null,
  });

  if (error) return { error: "Không thể tạo giao dịch: " + (error as { message: string }).message };

  // Update account balance
  const delta = parsed.data.type === "income" ? parsed.data.amount : -parsed.data.amount;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: acc } = await (supabase.from("accounts") as any)
    .select("balance").eq("id", parsed.data.account_id).single();
  if (acc) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("accounts") as any)
      .update({ balance: (acc as { balance: number }).balance + delta })
      .eq("id", parsed.data.account_id);
  }

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  return { success: true };
}

export async function updateTransactionAction(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Chưa đăng nhập" };

  // Validate subset (no account_id needed for update)
  const raw = {
    account_id:   "00000000-0000-0000-0000-000000000000", // placeholder to satisfy schema
    category_id:  formData.get("category_id")  as string,
    amount:       Number(formData.get("amount")),
    type:         formData.get("type")          as "income" | "expense",
    note:         (formData.get("note")         as string) || undefined,
    date:         formData.get("date")          as string,
    is_recurring: formData.get("is_recurring")  === "true",
  };

  const parsed = transactionSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("transactions") as any)
    .update({
      category_id:  parsed.data.category_id,
      amount:       parsed.data.amount,
      type:         parsed.data.type,
      note:         parsed.data.note ?? null,
      date:         parsed.data.date,
      is_recurring: parsed.data.is_recurring,
      updated_at:   new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: "Không thể cập nhật giao dịch" };
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteTransactionAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Chưa đăng nhập" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("transactions") as any)
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: "Không thể xóa giao dịch" };
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  return { success: true };
}
