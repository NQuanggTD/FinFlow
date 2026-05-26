"use client";

import { useState }                 from "react";
import { useQueryClient }           from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { deleteTransactionAction }  from "@/actions/transactions";
import { useToast }                 from "@/components/ui/Toast";
import { Badge }                    from "@/components/ui/Badge";
import { TransactionEditModal }     from "./TransactionEditModal";
import type { TransactionWithRelations } from "@/hooks/useTransactions";

export function TransactionItem({ transaction: t }: { transaction: TransactionWithRelations }) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing,  setEditing ] = useState(false);
  const { toast }  = useToast();
  const queryClient = useQueryClient();

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Xóa giao dịch này?")) return;
    setDeleting(true);
    const res = await deleteTransactionAction(t.id);
    setDeleting(false);
    if ("error" in res) toast(res.error ?? "Lỗi xóa", "error");
    else toast("Đã xóa giao dịch", "success");
  }

  function handleSaved() {
    void queryClient.invalidateQueries({ queryKey: ["transactions"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    setExpanded(false);
  }

  const catIcon  = t.categories?.icon  ?? "💳";
  const catName  = t.categories?.name  ?? "Khác";
  const catColor = t.categories?.color ?? "#6B7280";
  const accName  = t.accounts?.name    ?? "—";

  return (
    <>
      <div className="px-5 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer select-none"
        onClick={() => setExpanded((x) => !x)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
            style={{ backgroundColor: catColor + "22" }}>
            {catIcon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-gray-900 truncate">{catName}</p>
              {t.receipt_url  && <span title="Có hóa đơn" className="text-xs text-indigo-400">📎</span>}
              {t.is_recurring && <span title="Định kỳ"   className="text-xs text-amber-400">🔄</span>}
            </div>
            <p className="text-xs text-gray-400 truncate">{accName} · {t.note || "Không có ghi chú"}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-sm font-semibold ${t.type === "income" ? "text-green-600" : "text-red-500"}`}>
              {t.type === "income" ? "+" : "−"}{formatCurrency(t.amount)}
            </span>
            <span className={`text-gray-300 text-xs transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>▾</span>
          </div>
        </div>

        {expanded && (
          <div className="mt-3 border-t border-gray-50 pt-3 space-y-2.5" onClick={(e) => e.stopPropagation()}>
            <div className="flex gap-2 flex-wrap">
              <Badge label={t.type === "income" ? "📈 Thu nhập" : "📉 Chi tiêu"} color={t.type === "income" ? "green" : "red"} />
              <Badge label={formatDate(t.date, "dd/MM/yyyy")} color="gray" />
              {t.accounts?.name && <Badge label={t.accounts.name} color="indigo" />}
              {t.is_recurring   && <Badge label="Định kỳ" color="amber" />}
            </div>
            {t.note && <p className="text-xs text-gray-500">📝 {t.note}</p>}
            {t.receipt_url && (
              <a href={t.receipt_url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                📎 Xem hóa đơn
              </a>
            )}
            <div className="flex items-center gap-4 pt-1">
              <button onClick={(e) => { e.stopPropagation(); setEditing(true); }}
                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors">
                ✏️ Chỉnh sửa
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 disabled:opacity-50 transition-colors">
                🗑️ {deleting ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        )}
      </div>

      <TransactionEditModal
        transaction={t} open={editing}
        onClose={() => setEditing(false)} onSaved={handleSaved} />
    </>
  );
}
