import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { AccountManager } from "@/components/settings/AccountManager";
import { CategoryManager } from "@/components/settings/CategoryManager";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { ExportData } from "@/components/settings/ExportData";
import { DangerZone } from "@/components/settings/DangerZone";
import { redirect } from "next/navigation";
import type { ProfileRow, AccountRow } from "@/types/database";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cài đặt – FinFlow" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const [{ data: profileData }, { data: accountsData }] = await Promise.all([
    sb.from("profiles").select("*").eq("id", user.id).single(),
    sb
      .from("accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at"),
  ]);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cài đặt</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Quản lý thông tin cá nhân, danh mục, tài khoản và dữ liệu
        </p>
      </div>

      {/*
        ── 1. Category Manager ─────────────────────────────────────────────
        Placed first so users can set up categories BEFORE adding transactions.
        Without categories in the database, the transaction form has no options.
      */}
      <CategoryManager />

      <SettingsForm
        profile={profileData as ProfileRow | null}
        userId={user.id}
      />

      {/* ── 3. Change password ── */}
      <ChangePasswordForm />

      {/* ── 4. Account manager ── */}
      <AccountManager accounts={(accountsData ?? []) as AccountRow[]} />

      {/* ── 5. Export ── */}
      <ExportData userId={user.id} />

      {/* ── 6. Danger zone ── */}
      <DangerZone />
    </div>
  );
}
