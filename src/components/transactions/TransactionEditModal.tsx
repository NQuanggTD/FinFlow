"use client";

import { useState, useEffect, useRef } from "react";
import { Modal }                       from "@/components/ui/Modal";
import { Input }                       from "@/components/ui/Input";
import { Select }                      from "@/components/ui/Select";
import { Button }                      from "@/components/ui/Button";
import { updateTransactionAction }     from "@/actions/transactions";
import { createClient }                from "@/lib/supabase/client";
import { useToast }                    from "@/components/ui/Toast";
import { formatCurrency }              from "@/lib/utils/format";
import type { TransactionWithRelations } from "@/hooks/useTransactions";
import type { CategoryRow }            from "@/types/database";
import { cn } from "@/lib/utils/cn";

interface Props {
  transaction: TransactionWithRelations;
  open:        boolean;
  onClose:     () => void;
  onSaved:     () => void;
}

export function TransactionEditModal({ transaction: t, open, onClose, onSaved }: Props) {
  const [txType,     setTxType    ] = useState<"income"|"expense">(t.type);
  const [amount,     setAmount    ] = useState(String(t.amount));
  const [categoryId, setCategoryId] = useState(t.category_id);
  const [date,       setDate      ] = useState(t.date);
  const [note,       setNote      ] = useState(t.note ?? "");
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading,    setLoading   ] = useState(false);
  const isFirstMount = useRef(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    const sb = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    void (sb.from("categories") as any).select("*").order("name").then(({ data }: any) => {
      setCategories((data ?? []) as CategoryRow[]);
    });
  }, [open]);

  // Reset categoryId only when user changes type (not on initial mount)
  useEffect(() => {
    if (isFirstMount.current) { isFirstMount.current = false; return; }
    setCategoryId("");
  }, [txType]);

  const filteredCats = categories.filter((c) => c.type === txType);

  async function handleSave() {
    if (!amount || Number(amount) <= 0) { toast("Số tiền không hợp lệ", "error"); return; }
    if (!categoryId) { toast("Vui lòng chọn danh mục", "error"); return; }
    setLoading(true);
    const fd = new FormData();
    fd.set("type", txType); fd.set("amount", amount);
    fd.set("category_id", categoryId); fd.set("date", date);
    if (note) fd.set("note", note);
    const res = await updateTransactionAction(t.id, fd);
    setLoading(false);
    if ("error" in res) toast(res.error ?? "Lỗi cập nhật", "error");
    else { toast("Đã cập nhật giao dịch ✅", "success"); onSaved(); onClose(); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Chỉnh sửa giao dịch" size="md">
      <div className="space-y-4">
        {/* Type toggle */}
        <div className="flex rounded-xl overflow-hidden border border-gray-200 p-1 gap-1 bg-gray-50">
          {(["expense","income"] as const).map((tp) => (
            <button key={tp} type="button" onClick={() => setTxType(tp)}
              className={cn("flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all",
                txType===tp ? (tp==="expense" ? "bg-red-500 text-white shadow-sm" : "bg-green-500 text-white shadow-sm") : "text-gray-500 hover:text-gray-700")}>
              {tp==="expense" ? "📉 Chi tiêu" : "📈 Thu nhập"}
            </button>
          ))}
        </div>

        <div>
          <Input label="Số tiền (VND)" type="number" value={amount}
            onChange={(e) => setAmount(e.target.value)} leftAddon="₫" required min={1} />
          {amount && Number(amount) > 0 && (
            <p className="text-xs text-indigo-600 font-medium mt-1">{formatCurrency(Number(amount))}</p>
          )}
        </div>

        {filteredCats.length > 0
          ? <Select label="Danh mục" required value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)} placeholder="Chọn danh mục..."
              options={filteredCats.map(c => ({ value: c.id, label: `${c.icon} ${c.name}` }))} />
          : <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
              ⚠️ Không có danh mục {txType==="expense"?"chi tiêu":"thu nhập"}.
            </p>
        }

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngày giao dịch</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Ghi chú</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={500}
            placeholder="Mô tả giao dịch..."
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="outline" className="flex-1" onClick={onClose}>Huỷ</Button>
          <Button className="flex-1" loading={loading} onClick={() => void handleSave()}>Lưu thay đổi</Button>
        </div>
      </div>
    </Modal>
  );
}
