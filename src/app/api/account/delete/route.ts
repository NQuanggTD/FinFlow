import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient }                      from "@/lib/supabase/server";
import { NextResponse }                      from "next/server";

export async function DELETE() {
  // Verify the caller is authenticated using the regular (user-scoped) client
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { error: "Chức năng này chưa được cấu hình. Vui lòng liên hệ hỗ trợ." },
      { status: 501 },
    );
  }

  // Use admin client (service role) to delete the auth user.
  // Supabase cascades the delete to all user-owned rows via RLS foreign keys.
  const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
