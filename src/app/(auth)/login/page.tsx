import { LoginForm } from "@/components/auth/LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Đăng nhập – FinFlow" };

// Next.js 15: searchParams is now a Promise
interface Props {
  searchParams: Promise<{ message?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-3 shadow-lg">
              <span className="text-2xl">💰</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Chào mừng trở lại
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Đăng nhập vào tài khoản FinFlow
            </p>
          </div>

          {/* Success message from register */}
          {params.message && (
            <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-700 flex items-start gap-2">
              <span className="flex-shrink-0">✅</span>
              <div className="leading-5 font-medium">
                Đã gửi email xác nhận, vui lòng kiểm tra hộp thư
              </div>
            </div>
          )}

          <LoginForm />

          <p className="text-center text-sm text-gray-500 mt-6">
            Chưa có tài khoản?{" "}
            <a
              href="/register"
              className="text-indigo-600 font-semibold hover:underline"
            >
              Đăng ký miễn phí
            </a>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-4">
          FinFlow © 2026 · Bảo mật bởi Supabase Auth
        </p>
      </div>
    </main>
  );
}
