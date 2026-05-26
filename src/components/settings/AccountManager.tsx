"use client";

import { useState }              from "react";
import { useRouter }             from "next/navigation";
import { formatCurrency }        from "@/lib/utils/format";
import { createAccountAction, deleteAccountAction } from "@/actions/accounts";
import { Input }   from "@/components/ui/Input";
import { Select }  from "@/components/ui/Select";
import { Button }  from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge }   from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import type { AccountRow } from "@/types/database";

const ACCOUNT_ICONS: Record<string, string> = { bank: "🏦", cash: "💵", wallet: "👛" };
const ACCOUNT_TYPES = [
  { value: "bank",   label: "🏦 Tài khoản ngân hàng" },
  { value: "cash",   label: "💵 Tiền mặt"             },
  { value: "wallet", label: "👛 Ví điện tử"           },
];
const TYPE_LABELS: Record<string, string> = { bank: "Ngân hàng", cash: "Tiền mặt", wallet: "Ví điện tử" };

export function AccountManager({ accounts }: { accounts: AccountRow[] }) {
  const [name,      setName    ] = useState("");
  const [type,      setType    ] = useState<"bank"|"cash"|"wallet">("bank");
  const [balance,   setBalance ] = useState("0");
  const [adding,    setAdding  ] = useState(false);
  const [deletingId,setDel     ] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    const fd = new FormData();
    fd.set("name", name); fd.set("type", type); fd.set("balance", balance);
    const res = await createAccountAction(fd);
    setAdding(false);
    if ("error" in res) toast(res.error ?? "Lỗi tạo tài khoản", "error");
    else { toast(`Đã tạo tài khoản "${name}"! 🏦`, "success"); setName(""); setBalance("0"); router.refresh(); }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Ẩn tài khoản "${name}"? Dữ liệu giao dịch vẫn được giữ lại.`)) return;
    setDel(id);
    const res = await deleteAccountAction(id);
    setDel(null);
    if ("error" in res) toast(res.error ?? "Lỗi xóa tài khoản", "error");
    else { toast("Đã ẩn tài khoản", "success"); router.refresh(); }
  }

  const total = accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <Card>
      <CardHeader title="🏦 Quản lý tài khoản"
        subtitle={`${accounts.length} tài khoản · Tổng số dư: ${formatCurrency(total)}`} />

      {/* Account list */}
      {accounts.length > 0 && (
        <div className="space-y-2 mb-6">
          {accounts.map((a) => (
            <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl group">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{ACCOUNT_ICONS[a.type] ?? "💳"}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{a.name}</p>
                  <Badge label={TYPE_LABELS[a.type] ?? a.type} color="gray" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-semibold ${a.balance >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {formatCurrency(a.balance)}
                </span>
                <button
                  onClick={() => void handleDelete(a.id, a.name)}
                  disabled={deletingId === a.id}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                  title="Ẩn tài khoản"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      <div className="border-t border-gray-100 pt-5">
        <p className="text-sm font-semibold text-gray-700 mb-3">Thêm tài khoản mới</p>
        <form onSubmit={(e) => void handleAdd(e)} className="space-y-3">
          <Input label="Tên tài khoản" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="VD: Vietcombank, Tiền mặt..." required />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Loại tài khoản" value={type}
              onChange={(e) => setType(e.target.value as "bank"|"cash"|"wallet")} options={ACCOUNT_TYPES} />
            <Input label="Số dư ban đầu" type="number" value={balance}
              onChange={(e) => setBalance(e.target.value)} leftAddon="₫" min="0" />
          </div>
          <Button type="submit" variant="outline" loading={adding}>＋ Thêm tài khoản</Button>
        </form>
      </div>
    </Card>
  );
}
