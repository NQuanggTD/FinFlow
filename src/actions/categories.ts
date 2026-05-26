"use server";

import { createClient }   from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z }              from "zod";

const categorySchema = z.object({
  name: z.string().min(1,"Tên danh mục không được để trống").max(50),
  icon: z.string().min(1,"Vui lòng chọn biểu tượng").max(10),
  type: z.enum(["income","expense"]),
  color: z.string().default("#6B7280"),
});

export async function createCategoryAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Chưa đăng nhập" };

  const parsed = categorySchema.safeParse({
    name:  formData.get("name"),
    icon:  formData.get("icon"),
    type:  formData.get("type"),
    color: formData.get("color") ?? "#6B7280",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("categories") as any).insert({
    user_id:    user.id,
    name:       parsed.data.name,
    icon:       parsed.data.icon,
    type:       parsed.data.type,
    color:      parsed.data.color,
    is_default: false,
  });

  if (error) return { error: "Không thể tạo danh mục: " + error.message };
  revalidatePath("/settings");
  return { success: true };
}

export async function deleteCategoryAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Chưa đăng nhập" };

  // Check if used in transactions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: used } = await (supabase.from("transactions") as any)
    .select("id").eq("category_id", id).eq("is_deleted", false).limit(1);

  if (used && (used as unknown[]).length > 0)
    return { error: "Không thể xóa danh mục đang có giao dịch" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("categories") as any)
    .delete().eq("id", id).eq("user_id", user.id);

  if (error) return { error: "Không thể xóa danh mục" };
  revalidatePath("/settings");
  return { success: true };
}
