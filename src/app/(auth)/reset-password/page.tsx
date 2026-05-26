"use client";

import { useState, useEffect } from "react";
import { createClient }        from "@/lib/supabase/client";
import { useRouter }           from "next/navigation";

export default function ResetPasswordPage() {
  const [password,  setPassword ] = useState("");
  const [confirm,   setConfirm  ] = useState("");
  const [loading,   setLoading  ] = useState(false);
  const [checking,  setChecking ] = useState(true);
  const [hasSession,setHasSession] = useState(false);
  const [error,     setError    ] = useState("");
  const [success,   setSuccess  ] = useState(false);
  const router = useRouter();

  // Wait for Supabase to process the hash token
  useEffect(() => {
    const supabase = createClient();

    // Check if already has session (from hash token)
    void supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
      setChecking(false);
    });

    // Listen for auth state change (token processed from URL hash)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        setHasSession(true);
        setChecking(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError("Mật khẩu ít nhất 8 ký tự"); return; }
    if (password !== confirm)  { setError("Mật khẩu xác nhận không khớp"); return; }
    setLoading(true); setError("");
    const { error: err } = await createClient().auth.updateUser({ password });
    setLoading(false);
    if (err) setError(err.message);
    else {
      setSuccess(true);
      setTimeout(() => router.push("/login?message=Mật khẩu đã được cập nhật, vui lòng đăng nhập"), 2000);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-3 shadow-lg">
            <span className="text-2xl">🔒</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Đặt lại mật khẩu</h1>
          <p className="text-gray-500 text-sm mt-1">Nhập mật khẩu mới cho tài khoản của bạn</p>
        </div>

        {checking ? (
          <div className="text-center py-6 text-gray-400">
            <div className="text-2xl mb-2">⏳</div>
            <p className="text-sm">Đang xác thực liên kết...</p>
          </div>
        ) : !hasSession ? (
          <div className="text-center space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-2xl mb-2">❌</p>
              <p className="font-semibold text-red-800">Liên kết không hợp lệ</p>
              <p className="text-sm text-red-600 mt-1">Liên kết đặt lại mật khẩu đã hết hạn hoặc không hợp lệ.</p>
            </div>
            <button onClick={() => router.push("/forgot-password")}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors">
              Gửi lại email đặt lại mật khẩu
            </button>
          </div>
        ) : success ? (
          <div className="text-center p-4 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-3xl mb-2">✅</p>
            <p className="font-semibold text-green-800">Mật khẩu đã được cập nhật!</p>
            <p className="text-sm text-green-600 mt-1">Đang chuyển về trang đăng nhập...</p>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">⚠️ {error}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                required minLength={8} placeholder="Tối thiểu 8 ký tự"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Xác nhận mật khẩu <span className="text-red-500">*</span>
              </label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                required minLength={8} placeholder="Nhập lại mật khẩu"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            {password && confirm && password !== confirm && (
              <p className="text-xs text-red-500">Mật khẩu không khớp</p>
            )}
            <button type="submit" disabled={loading || (password.length > 0 && password !== confirm)}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-60 transition-colors">
              {loading ? "Đang lưu..." : "Đặt lại mật khẩu"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
