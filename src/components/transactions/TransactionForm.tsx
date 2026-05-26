"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { createTransactionAction } from "@/actions/transactions";
import { Input }  from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

interface Category { id: string; name: string; icon: string; type: "income" | "expense"; }
interface Account  { id: string; name: string; balance: number; }
interface Props { categories: Category[]; accounts: Account[]; onSuccess?: () => void; }

export function TransactionForm({ categories, accounts, onSuccess }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [txType,        setTxType      ] = useState<"income" | "expense">("expense");
  const [amount,        setAmount      ] = useState("");
  const [accountId,     setAccountId   ] = useState(accounts[0]?.id ?? "");
  const [categoryId,    setCategoryId  ] = useState("");
  const [date,          setDate        ] = useState(new Date().toISOString().split("T")[0]);
  const [note,          setNote        ] = useState("");
  const [isRecurring,   setIsRecurring ] = useState(false);
  const [receiptFile,   setReceiptFile ] = useState<File | null>(null);
  const [loading,       setLoading     ] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const filteredCats = categories.filter((c) => c.type === txType);

  // Reset category when type changes
  function handleTypeChange(t: "income" | "expense") {
    setTxType(t);
    setCategoryId("");
  }

  function resetForm() {
    setAmount("");
    setCategoryId("");
    setDate(new Date().toISOString().split("T")[0]);
    setNote("");
    setIsRecurring(false);
    setReceiptFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!accountId)  { toast("Vui lòng chọn tài khoản",  "error"); return; }
    if (!categoryId) { toast("Vui lòng chọn danh mục",   "error"); return; }
    if (!amount || Number(amount) <= 0) { toast("Vui lòng nhập số tiền hợp lệ", "error"); return; }

    setLoading(true);

    const fd = new FormData();
    fd.set("type",         txType);
    fd.set("amount",       amount);
    fd.set("account_id",   accountId);
    fd.set("category_id",  categoryId);
    fd.set("date",         date);
    fd.set("note",         note);
    fd.set("is_recurring", String(isRecurring));

    if (receiptFile) {
      try {
        const uploadFD = new FormData();
        uploadFD.append("file", receiptFile);
        const res  = await fetch("/api/upload/receipt", { method: "POST", body: uploadFD });
        const data = await res.json() as { url?: string; error?: string };
        if (data.url) fd.set("receipt_url", data.url);
        else toast("Không thể upload hóa đơn, tiếp tục lưu giao dịch", "warning");
      } catch {
        toast("Lỗi upload hóa đơn, tiếp tục lưu giao dịch", "warning");
      }
    }

    const result = await createTransactionAction(fd);
    setLoading(false);

    if (result && "error" in result) {
      toast(result.error ?? "Lỗi không xác định", "error");
    } else {
      toast("Giao dịch đã được tạo thành công! 🎉", "success");
      resetForm();
      onSuccess?.();
      // Invalidate cache immediately so dashboard shows fresh data on arrival
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["accounts"] }),
      ]);
      router.push("/dashboard");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Type toggle */}
      <div className="flex rounded-xl overflow-hidden border border-gray-200 p-1 gap-1 bg-gray-50">
        {(["expense", "income"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => handleTypeChange(t)}
            className={cn(
              "flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all",
              txType === t
                ? t === "expense"
                  ? "bg-red-500 text-white shadow-sm"
                  : "bg-green-500 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {t === "expense" ? "📉 Chi tiêu" : "📈 Thu nhập"}
          </button>
        ))}
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Số tiền <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₫</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            min={1}
            className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        {amount && Number(amount) > 0 && (
          <p className="text-xs text-indigo-600 mt-1 font-medium">{formatCurrency(Number(amount))}</p>
        )}
      </div>

      {/* Account */}
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

      {/* Category */}
      {filteredCats.length === 0 ? (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          ⚠️ Không có danh mục {txType === "expense" ? "chi tiêu" : "thu nhập"}. Vui lòng thêm trong Cài đặt.
        </div>
      ) : (
        <Select
          label="Danh mục"
          required
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          placeholder="Chọn danh mục..."
          options={filteredCats.map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` }))}
        />
      )}

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Ngày giao dịch <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={new Date().toISOString().split("T")[0]}
          className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Note */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Ghi chú</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="Mô tả ngắn về giao dịch..."
          className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
        {note.length > 400 && (
          <p className="text-xs text-gray-400 text-right mt-0.5">{note.length}/500</p>
        )}
      </div>

      {/* Receipt */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Hóa đơn (tuỳ chọn)</label>
        <label
          className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
          />
          {receiptFile ? (
            <div className="text-center">
              <p className="text-sm text-indigo-600 font-medium">📎 {receiptFile.name}</p>
              <p className="text-xs text-gray-400 mt-1">{(receiptFile.size / 1024).toFixed(0)} KB</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-2xl mb-1">📷</p>
              <p className="text-sm text-gray-500">Chụp hoặc chọn ảnh hóa đơn</p>
              <p className="text-xs text-gray-400">JPG, PNG, HEIC · tối đa 5MB</p>
            </div>
          )}
        </label>
      </div>

      {/* Recurring */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <div
          onClick={() => setIsRecurring((x) => !x)}
          className={cn(
            "w-10 h-6 rounded-full transition-colors flex items-center px-1",
            isRecurring ? "bg-indigo-600" : "bg-gray-200"
          )}
        >
          <div className={cn(
            "w-4 h-4 bg-white rounded-full shadow transition-transform",
            isRecurring ? "translate-x-4" : "translate-x-0"
          )} />
        </div>
        <span className="text-sm text-gray-700">🔄 Giao dịch định kỳ (lặp lại hàng tháng)</span>
      </label>

      <Button type="submit" className="w-full" size="lg" loading={loading}>
        {txType === "expense" ? "💸 Ghi chi tiêu" : "💰 Ghi thu nhập"}
      </Button>
    </form>
  );
}
