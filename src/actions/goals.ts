"use server";

import { createClient }   from "@/lib/supabase/server";
import { goalSchema }     from "@/lib/validations/goal";
import { revalidatePath } from "next/cache";

export async function createGoalAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Chưa đăng nhập" };

  const raw = {
    name:          formData.get("name")          as string,
    target_amount: Number(formData.get("target_amount")),
    deadline:      formData.get("deadline")      as string,
    priority:      Number(formData.get("priority") ?? 1),
  };

  const parsed = goalSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("goals") as any).insert({
    user_id:        user.id,
    name:           parsed.data.name,
    target_amount:  parsed.data.target_amount,
    deadline:       parsed.data.deadline,
    priority:       parsed.data.priority,
    current_amount: 0,
    status:         "active",
  });

  if (error) return { error: "Không thể tạo mục tiêu: " + (error as { message: string }).message };
  revalidatePath("/goals");
  return { success: true };
}

export async function depositToGoalAction(goalId: string, amount: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Chưa đăng nhập" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: goal, error: fetchErr } = await (supabase.from("goals") as any)
    .select("current_amount, target_amount")
    .eq("id", goalId)
    .eq("user_id", user.id)
    .single();

  if (fetchErr || !goal) return { error: "Không tìm thấy mục tiêu" };

  const g          = goal as { current_amount: number; target_amount: number };
  const newAmount  = g.current_amount + amount;
  const newStatus  = newAmount >= g.target_amount ? "completed" : "active";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("goals") as any)
    .update({ current_amount: newAmount, status: newStatus })
    .eq("id", goalId);

  if (error) return { error: "Không thể nạp tiền" };
  revalidatePath("/goals");
  return { success: true };
}

export async function deleteGoalAction(goalId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Chưa đăng nhập" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("goals") as any)
    .delete().eq("id", goalId).eq("user_id", user.id);

  if (error) return { error: "Không thể xóa mục tiêu" };
  revalidatePath("/goals");
  return { success: true };
}

export async function updateGoalAction(goalId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Chưa đăng nhập" };

  const name          = (formData.get("name") as string)?.trim();
  const target_amount = Number(formData.get("target_amount"));
  const deadline      = formData.get("deadline") as string;
  const priority      = Number(formData.get("priority") ?? 1);

  if (!name)              return { error: "Tên mục tiêu không được để trống" };
  if (target_amount <= 0) return { error: "Số tiền phải lớn hơn 0" };
  if (!deadline)          return { error: "Vui lòng chọn ngày hoàn thành" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("goals") as any)
    .update({ name, target_amount, deadline, priority })
    .eq("id", goalId).eq("user_id", user.id);

  if (error) return { error: "Không thể cập nhật mục tiêu" };
  revalidatePath("/goals");
  return { success: true };
}
