"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(1, "Tên danh mục không được để trống").max(50),
  icon: z.string().min(1, "Vui lòng chọn biểu tượng").max(10),
  type: z.enum(["income", "expense"]),
  color: z.string().default("#6B7280"),
});

const updateSchema = z.object({
  id: z.string().uuid("ID không hợp lệ"),
  name: z.string().min(1, "Tên không được để trống").max(50),
  icon: z.string().min(1).max(10),
  color: z.string(),
});

export async function createCategoryAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Chưa đăng nhập" };

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    icon: formData.get("icon"),
    type: formData.get("type"),
    color: formData.get("color") ?? "#6B7280",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Prevent duplicate names per user + type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase.from("categories") as any)
    .select("id")
    .eq("user_id", user.id)
    .eq("type", parsed.data.type)
    .ilike("name", parsed.data.name)
    .limit(1);

  if (existing && (existing as unknown[]).length > 0) {
    return {
      error: `Danh mục "${parsed.data.name}" đã tồn tại trong loại này`,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("categories") as any).insert({
    user_id: user.id,
    name: parsed.data.name,
    icon: parsed.data.icon,
    type: parsed.data.type,
    color: parsed.data.color,
    is_default: false,
  });

  if (error) return { error: "Không thể tạo danh mục: " + error.message };
  revalidatePath("/settings");
  revalidatePath("/transactions/new");
  return { success: true };
}

export async function updateCategoryAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Chưa đăng nhập" };

  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    icon: formData.get("icon"),
    color: formData.get("color"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Verify ownership — cannot edit default categories
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cat } = await (supabase.from("categories") as any)
    .select("user_id, is_default")
    .eq("id", parsed.data.id)
    .single();

  if (!cat) return { error: "Danh mục không tồn tại" };
  if ((cat as { is_default: boolean }).is_default) {
    return { error: "Không thể chỉnh sửa danh mục mặc định" };
  }
  if ((cat as { user_id: string }).user_id !== user.id) {
    return { error: "Không có quyền chỉnh sửa danh mục này" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("categories") as any)
    .update({
      name: parsed.data.name,
      icon: parsed.data.icon,
      color: parsed.data.color,
    })
    .eq("id", parsed.data.id)
    .eq("user_id", user.id);

  if (error) return { error: "Không thể cập nhật danh mục: " + error.message };
  revalidatePath("/settings");
  revalidatePath("/transactions/new");
  return { success: true };
}

export async function deleteCategoryAction(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Chưa đăng nhập" };

  // Prevent deleting default categories
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cat } = await (supabase.from("categories") as any)
    .select("user_id, is_default")
    .eq("id", id)
    .single();

  if (!cat) return { error: "Danh mục không tồn tại" };
  if ((cat as { is_default: boolean }).is_default) {
    return { error: "Không thể xóa danh mục mặc định" };
  }
  if ((cat as { user_id: string }).user_id !== user.id) {
    return { error: "Không có quyền xóa danh mục này" };
  }

  // Check if used in transactions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: used } = await (supabase.from("transactions") as any)
    .select("id")
    .eq("category_id", id)
    .eq("is_deleted", false)
    .limit(1);

  if (used && (used as unknown[]).length > 0)
    return { error: "Không thể xóa danh mục đang có giao dịch" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("categories") as any)
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: "Không thể xóa danh mục" };
  revalidatePath("/settings");
  revalidatePath("/transactions/new");
  return { success: true };
}
