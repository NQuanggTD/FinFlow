import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code  = searchParams.get("code");
  const error = searchParams.get("error");
  const next  = searchParams.get("next") ?? "/dashboard";

  // Handle OAuth error from Supabase
  if (error) {
    const errorDesc = searchParams.get("error_description") ?? error;
    return NextResponse.redirect(
      `${origin}/login?message=${encodeURIComponent("Lỗi xác thực: " + errorDesc)}`
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
    if (sessionError) {
      return NextResponse.redirect(
        `${origin}/login?message=${encodeURIComponent("Phiên đăng nhập không hợp lệ, vui lòng thử lại")}`
      );
    }
  }

  // Ensure next is a relative path (prevent open redirect)
  const safeNext = next.startsWith("/") ? next : "/dashboard";
  return NextResponse.redirect(`${origin}${safeNext}`);
}
