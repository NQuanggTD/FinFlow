"use client";

import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { createTransactionAction } from "@/actions/transactions";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { CategoryRow, AccountRow } from "@/types/database";

interface Props {
  open: boolean;
  defaultDate: string;
  onClose: () => void;
  onSaved: () => void;
}

export function AddTransactionModal({
  open,
  defaultDate,
  onClose,
  onSaved,
}: Props) {
  const [txType, setTxType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [note, setNote] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDate(defaultDate);
    const sb = createClient();

    void sb
      .from("categories")
      .select("*")
      .order("name")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(({ data }: any) => {
        setCategories((data ?? []) as CategoryRow[]);
      });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    void (sb.from("accounts") as any)
      .select("*")
      .eq("is_active", true)
      .order("name")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(({ data }: any) => {
        const accs = (data ?? []) as AccountRow[];
        setAccounts(accs);
        if (accs.length > 0) setAccountId((prev) => prev || accs[0].id);
      });

    setTimeout(() => amountRef.current?.focus(), 100);
  }, [open, defaultDate]);

  const filteredCats = categories.filter((c) => c.type === txType);

  function handleTypeChange(t: "income" | "expense") {
    setTxType(t);
    setCategoryId("");
  }

  function resetForm() {
    setAmount("");
    setCategoryId("");
    setNote("");
    setIsRecurring(false);
  }

  async function handleSave() {
    if (!accountId) {
      toast("Vui lòng chọn tài khoản", "error");
      return;
    }
    if (!categoryId) {
      toast("Vui lòng chọn danh mục", "error");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast("Số tiền không hợp lệ", "error");
      return;
    }

    setLoading(true);
    const fd = new FormData();
    fd.set("type", txType);
    fd.set("amount", amount);
    fd.set("account_id", accountId);
    fd.set("category_id", categoryId);
    fd.set("date", date);
    fd.set("note", note);
    fd.set("is_recurring", String(isRecurring));

    const result = await createTransactionAction(fd);
    setLoading(false);

    if (result && "error" in result) {
      toast(result.error ?? "Lỗi không xác định", "error");
      return;
    }

    toast("Giao dịch đã được tạo! 🎉", "success");
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
      queryClient.invalidateQueries({ queryKey: ["accounts"] }),
      queryClient.invalidateQueries({ queryKey: ["budgets-usage"] }),
    ]);
    resetForm();
    onSaved();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Thêm giao dịch" size="md">
      <div className="space-y-4">
        <div className="flex rounded-xl overflow-hidden border border-gray-200 p-1 gap-1 bg-gray-50">
          {(["expense", "income"] as const).map((tp) => (
            <button
              key={tp}
              type="button"
              onClick={() => handleTypeChange(tp)}
              className={cn(
                "flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all",
                txType === tp
                  ? tp === "expense"
                    ? "bg-red-500 text-white shadow-sm"
                    : "bg-green-500 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700",
              )}
            >
              {tp === "expense" ? "📉 Chi tiêu" : "📈 Thu nhập"}
            </button>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Số tiền <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              ₫
            </span>
            <input
              ref={amountRef}
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSave();
              }}
              placeholder="0"
              min={1}
              className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          {amount && Number(amount) > 0 && (
            <p className="text-xs text-indigo-600 mt-1 font-medium">
              {formatCurrency(Number(amount))}
            </p>
          )}
        </div>

        {accounts.length === 0 ? (
          <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
            ⚠️ Chưa có tài khoản. Vui lòng thêm trong Cài đặt.
          </p>
        ) : (
          <Select
            label="Tài khoản"
            required
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            placeholder="Chọn tài khoản..."
            options={accounts.map((a) => ({
              value: a.id,
              label: `${a.name} · ${formatCurrency(a.balance)}`,
            }))}
          />
        )}

        {filteredCats.length === 0 ? (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
            ⚠️ Không có danh mục{" "}
            {txType === "expense" ? "chi tiêu" : "thu nhập"}. Vui lòng thêm
            trong Cài đặt.
          </div>
        ) : (
          <Select
            label="Danh mục"
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            placeholder="Chọn danh mục..."
            options={filteredCats.map((c) => ({
              value: c.id,
              label: `${c.icon} ${c.name}`,
            }))}
          />
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Ngày giao dịch
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Ghi chú
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Mô tả giao dịch..."
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div
            onClick={() => setIsRecurring((x) => !x)}
            className={cn(
              "w-10 h-6 rounded-full transition-colors flex items-center px-1",
              isRecurring ? "bg-indigo-600" : "bg-gray-200",
            )}
          >
            <div
              className={cn(
                "w-4 h-4 bg-white rounded-full shadow transition-transform",
                isRecurring ? "translate-x-4" : "translate-x-0",
              )}
            />
          </div>
          <span className="text-sm text-gray-700">🔄 Giao dịch định kỳ</span>
        </label>

        <div className="flex gap-3 pt-1">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Huỷ
          </Button>
          <Button
            className="flex-1"
            loading={loading}
            onClick={() => void handleSave()}
          >
            {txType === "expense" ? "💸 Ghi chi tiêu" : "💰 Ghi thu nhập"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
