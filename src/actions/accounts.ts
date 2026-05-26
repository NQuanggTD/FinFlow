"use server";

import { createClient }   from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z }              from "zod";

const accountSchema = z.object({
  name:    z.string().min(1,"Tên tài khoản không được để trống").max(50),
  type:    z.enum(["bank","cash","wallet"]),
  balance: z.coerce.number().min(0,"Số dư không được âm"),
});

const ICONS: Record<string, string> = { bank: "🏦", cash: "💵", wallet: "👛" };

export async function createAccountAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Chưa đăng nhập" };

  const parsed = accountSchema.safeParse({
    name:    formData.get("name"),
    type:    formData.get("type"),
    balance: Number(formData.get("balance") ?? 0),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Ensure profile exists (needed before creating account due to FK chain)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("profiles") as any).upsert({
    id:       user.id,
    full_name: user.user_metadata?.full_name ?? null,
    currency: "VND",
    timezone: "Asia/Ho_Chi_Minh",
  }, { onConflict: "id" });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("accounts") as any).insert({
    user_id:   user.id,
    name:      parsed.data.name,
    type:      parsed.data.type,
    balance:   parsed.data.balance,
    color:     "#4F46E5",
    icon:      ICONS[parsed.data.type] ?? "💳",
    is_active: true,
  });

  if (error) return { error: "Không thể tạo tài khoản: " + error.message };
  revalidatePath("/settings");
  return { success: true };
}

export async function deleteAccountAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Chưa đăng nhập" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: used } = await (supabase.from("transactions") as any)
    .select("id").eq("account_id", id).eq("is_deleted", false).limit(1);

  if (used && (used as unknown[]).length > 0)
    return { error: "Không thể xóa tài khoản đang có giao dịch. Hãy ẩn tài khoản thay vì xóa." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("accounts") as any)
    .update({ is_active: false })
    .eq("id", id).eq("user_id", user.id);

  if (error) return { error: "Không thể ẩn tài khoản" };
  revalidatePath("/settings");
  return { success: true };
}
