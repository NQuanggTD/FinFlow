"use server";

import { createClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import { redirect } from "next/navigation";

type ActionState = { error?: string; success?: boolean } | null;

export async function loginAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    email:    formData.get("email")    as string,
    password: formData.get("password") as string,
  };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Email hoặc mật khẩu không đúng" };
  redirect("/dashboard");
}

export async function registerAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    email:           formData.get("email")           as string,
    password:        formData.get("password")        as string,
    full_name:       formData.get("full_name")       as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email:    parsed.data.email,
    password: parsed.data.password,
    options:  { data: { full_name: parsed.data.full_name } },
  });
  if (error) return { error: error.message };
  redirect("/login?message=Vui lòng kiểm tra email để xác nhận tài khoản");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function changePasswordAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const newPassword = formData.get("newPassword")     as string;
  const confirm     = formData.get("confirmPassword") as string;

  if (!newPassword || newPassword.length < 8)
    return { error: "Mật khẩu mới phải có ít nhất 8 ký tự" };
  if (newPassword !== confirm)
    return { error: "Mật khẩu xác nhận không khớp" };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };
  return { success: true };
}
