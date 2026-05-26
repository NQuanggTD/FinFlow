"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";

interface Props { userId: string }

export function ExportData({ userId }: Props) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  function triggerDownload(filename: string, content: string, mimeType: string) {
    // BOM (\uFEFF) ensures Excel opens CSV with correct UTF-8 encoding
    const blob = new Blob(["\uFEFF" + content], { type: `${mimeType};charset=utf-8;` });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  async function handleExport(format: "csv" | "json") {
    setLoading(true);
    const sb = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (sb as any)
      .from("transactions")
      .select("date, type, amount, note, categories(name, icon), accounts(name)")
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .order("date", { ascending: false });

    if (error || !data) {
      toast("Lỗi khi tải dữ liệu giao dịch", "error");
      setLoading(false);
      return;
    }

    type Row = {
      date: string; type: string; amount: number; note: string | null;
      categories: { name: string; icon: string } | null;
      accounts:   { name: string } | null;
    };
    const rows = data as Row[];
    const dateStr = new Date().toISOString().split("T")[0];

    if (format === "csv") {
      const headers = ["Ngày", "Loại", "Số tiền (VND)", "Danh mục", "Tài khoản", "Ghi chú"];
      const lines = rows.map((t) => [
        t.date,
        t.type === "income" ? "Thu nhập" : "Chi tiêu",
        t.amount,
        `${t.categories?.icon ?? ""} ${t.categories?.name ?? ""}`.trim(),
        t.accounts?.name ?? "",
        t.note ?? "",
      ].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","));

      triggerDownload(
        `finflow-giaodich-${dateStr}.csv`,
        [headers.join(","), ...lines].join("\n"),
        "text/csv",
      );
    } else {
      triggerDownload(
        `finflow-giaodich-${dateStr}.json`,
        JSON.stringify(rows, null, 2),
        "application/json",
      );
    }

    toast(`Đã xuất ${rows.length} giao dịch thành công! 📊`, "success");
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader title="📤 Xuất dữ liệu" subtitle="Tải xuống toàn bộ lịch sử giao dịch của bạn" />
      <p className="text-sm text-gray-500 mb-5">
        Xuất file <strong>CSV</strong> để mở bằng Excel / Google Sheets, hoặc <strong>JSON</strong> để sử dụng với các ứng dụng khác.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => void handleExport("csv")}
          disabled={loading}
          className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 text-left hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors disabled:opacity-50"
        >
          <span className="text-2xl">📊</span>
          <div>
            <p className="text-sm font-semibold text-gray-800">Xuất CSV</p>
            <p className="text-xs text-gray-400 mt-0.5">Excel, Google Sheets</p>
          </div>
        </button>

        <button
          onClick={() => void handleExport("json")}
          disabled={loading}
          className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 text-left hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors disabled:opacity-50"
        >
          <span className="text-2xl">📋</span>
          <div>
            <p className="text-sm font-semibold text-gray-800">Xuất JSON</p>
            <p className="text-xs text-gray-400 mt-0.5">Dành cho lập trình viên</p>
          </div>
        </button>
      </div>
      {loading && (
        <p className="text-xs text-indigo-600 mt-3 text-center animate-pulse">⏳ Đang chuẩn bị dữ liệu...</p>
      )}
    </Card>
  );
}
