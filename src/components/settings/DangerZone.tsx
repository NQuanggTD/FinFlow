"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";

export function DangerZone() {
  const [showDelete,   setShowDelete  ] = useState(false);
  const [confirmText,  setConfirmText ] = useState("");
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function handleSignOutAll() {
    setLoadingLogout(true);
    const sb = createClient();
    await sb.auth.signOut({ scope: "global" });
    router.push("/login");
  }

  async function handleDeleteAccount() {
    if (confirmText !== "XÓA TÀI KHOẢN") {
      toast("Vui lòng nhập đúng cụm từ xác nhận", "error");
      return;
    }
    setLoadingDelete(true);
    const res  = await fetch("/api/account/delete", { method: "DELETE" });
    const data = await res.json() as { success?: boolean; error?: string };
    if (!res.ok || data.error) {
      toast(data.error ?? "Không thể xóa tài khoản", "error");
      setLoadingDelete(false);
      return;
    }
    router.push("/login?message=Tài khoản đã được xóa thành công");
  }

  return (
    <Card>
      <CardHeader title="⚠️ Vùng nguy hiểm" subtitle="Các thao tác ảnh hưởng đến toàn bộ tài khoản của bạn" />

      <div className="space-y-3">
        {/* ── Sign out all devices ── */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-amber-200 bg-amber-50/30">
          <div>
            <p className="text-sm font-semibold text-gray-900">Đăng xuất tất cả thiết bị</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Kết thúc tất cả phiên đăng nhập đang hoạt động trên mọi thiết bị
            </p>
          </div>
          <button
            onClick={() => void handleSignOutAll()}
            disabled={loadingLogout}
            className="ml-4 shrink-0 px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors disabled:opacity-50"
          >
            {loadingLogout ? "⏳..." : "Đăng xuất"}
          </button>
        </div>

        {/* ── Delete account ── */}
        <div className="p-4 rounded-xl border border-red-200 bg-red-50/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-red-700">Xóa tài khoản</p>
              <p className="text-xs text-red-500 mt-0.5">
                Xóa vĩnh viễn tài khoản và toàn bộ dữ liệu của bạn
              </p>
            </div>
            {!showDelete && (
              <button
                onClick={() => setShowDelete(true)}
                className="ml-4 shrink-0 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
              >
                Xóa tài khoản
              </button>
            )}
          </div>

          {showDelete && (
            <div className="mt-4 space-y-3 border-t border-red-200 pt-4">
              <p className="text-sm text-red-700">
                Hành động này <strong>không thể hoàn tác</strong>. Toàn bộ giao dịch, ngân sách,
                mục tiêu và hồ sơ của bạn sẽ bị xóa vĩnh viễn.
              </p>
              <p className="text-sm text-red-600">
                Nhập <strong className="font-mono">XÓA TÀI KHOẢN</strong> để xác nhận:
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="XÓA TÀI KHOẢN"
                className="w-full px-3 py-2 rounded-lg border border-red-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white placeholder:text-red-300"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowDelete(false); setConfirmText(""); }}
                  className="flex-1 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={() => void handleDeleteAccount()}
                  disabled={loadingDelete || confirmText !== "XÓA TÀI KHOẢN"}
                  className="flex-1 px-3 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loadingDelete ? "⏳ Đang xóa..." : "Xóa vĩnh viễn"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
