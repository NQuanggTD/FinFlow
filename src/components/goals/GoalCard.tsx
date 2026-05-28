"use client";

import { useState, useEffect }   from "react";
import { useRouter }              from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { ProgressBar }            from "@/components/ui/ProgressBar";
import { Modal }                  from "@/components/ui/Modal";
import { Input }                  from "@/components/ui/Input";
import { Select }                 from "@/components/ui/Select";
import { Button }                 from "@/components/ui/Button";
import { useToast }               from "@/components/ui/Toast";
import { depositToGoalAction, deleteGoalAction, updateGoalAction } from "@/actions/goals";
import type { GoalRow }           from "@/types/database";

const PRIORITY: Record<number, { label: string; cls: string }> = {
  1: { label: "Thấp",       cls: "bg-gray-100 text-gray-600"   },
  2: { label: "Trung bình", cls: "bg-amber-100 text-amber-700" },
  3: { label: "Cao",        cls: "bg-red-100 text-red-600"     },
};
const QUICK = [50_000, 100_000, 200_000, 500_000, 1_000_000];

export function GoalCard({ goal: g, completed = false }: { goal: GoalRow; completed?: boolean }) {
  const [showDeposit, setShowDeposit] = useState(false);
  const [showEdit,    setShowEdit   ] = useState(false);
  const [depositAmt,  setDepositAmt ] = useState("");
  const [editName,    setEditName   ] = useState(g.name);
  const [editAmt,     setEditAmt    ] = useState(String(g.target_amount));
  const [editDL,      setEditDL     ] = useState(g.deadline);
  const [editPri,     setEditPri    ] = useState(String(g.priority));
  const [loading,     setLoading    ] = useState(false);
  const [deleting,    setDeleting   ] = useState(false);
  const { toast } = useToast();
  const router    = useRouter();

  const pct       = g.target_amount > 0 ? Math.min((g.current_amount / g.target_amount) * 100, 100) : 0;
  const remaining = g.target_amount - g.current_amount;
  // Compute days left on mount to avoid impure Date.now() during render
  const [daysLeft, setDaysLeft] = useState<number>(() => 0 as number);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDaysLeft(Math.ceil((new Date(g.deadline).getTime() - Date.now()) / 86400000));
  }, [g.deadline]);
  const priority  = PRIORITY[g.priority] ?? PRIORITY[1];
  const dailyNeeded = daysLeft > 0 && remaining > 0 ? remaining / daysLeft : 0;
  const isOverdue = daysLeft < 0 && !completed;

  async function handleDeposit() {
    const amount = Number(depositAmt.replace(/,/g, ""));
    if (!amount || amount <= 0) { toast("Số tiền không hợp lệ", "error"); return; }
    setLoading(true);
    const res = await depositToGoalAction(g.id, amount);
    setLoading(false);
    if ("error" in res) toast(res.error ?? "Lỗi", "error");
    else { toast(`Đã nạp ${formatCurrency(amount)}! 🎉`, "success"); setShowDeposit(false); setDepositAmt(""); router.refresh(); }
  }

  async function handleDelete() {
    if (!confirm(`Xóa mục tiêu "${g.name}"? Hành động này không thể hoàn tác.`)) return;
    setDeleting(true);
    const res = await deleteGoalAction(g.id);
    setDeleting(false);
    if ("error" in res) toast(res.error ?? "Lỗi xóa", "error");
    else { toast("Đã xóa mục tiêu", "success"); router.refresh(); }
  }

  async function handleEdit() {
    setLoading(true);
    const fd = new FormData();
    fd.set("name", editName); fd.set("target_amount", editAmt);
    fd.set("deadline", editDL); fd.set("priority", editPri);
    const res = await updateGoalAction(g.id, fd);
    setLoading(false);
    if ("error" in res) toast(res.error ?? "Lỗi cập nhật", "error");
    else { toast("Đã cập nhật mục tiêu ✅", "success"); setShowEdit(false); router.refresh(); }
  }

  return (
    <>
      <div className={`bg-white rounded-xl shadow-sm overflow-hidden transition-shadow group ${
        completed ? "border border-green-200 opacity-85" : "border border-gray-100 hover:shadow-md"
      }`}>
        {/* Cover */}
        <div className="h-28 flex items-end relative"
          style={g.cover_url
            ? { backgroundImage: `url(${g.cover_url})`, backgroundSize: "cover", backgroundPosition: "center" }
            : { background: "linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%)" }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <span className={`absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full transition-opacity group-hover:opacity-0 ${priority.cls}`}>{priority.label}</span>
          {isOverdue  && <span className="absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Quá hạn</span>}
          {completed  && <div className="absolute inset-0 bg-green-500/50 flex items-center justify-center"><span className="text-4xl">🎊</span></div>}

          {/* Edit / Delete buttons */}
          {!completed && (
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <button onClick={() => setShowEdit(true)}
                className="p-1.5 bg-white/80 rounded-lg text-gray-700 hover:bg-white transition-colors text-xs">✏️</button>
              <button onClick={() => void handleDelete()} disabled={deleting}
                className="p-1.5 bg-white/80 rounded-lg text-red-500 hover:bg-white transition-colors text-xs disabled:opacity-50">
                {deleting ? "…" : "🗑️"}
              </button>
            </div>
          )}

          <p className="relative z-10 px-4 pb-3 text-white font-bold text-base drop-shadow truncate w-full">{g.name}</p>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          <p className="text-xs text-gray-400">
            🗓️ Hạn: {formatDate(g.deadline)}
            {daysLeft > 0 && !completed && (
              <span className={`ml-1 font-medium ${daysLeft <= 7 ? "text-red-500" : "text-gray-500"}`}>· còn {daysLeft} ngày</span>
            )}
          </p>
          <ProgressBar value={pct} size="md" color={completed ? "green" : "auto"} />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Đã có: <strong className="text-indigo-600">{formatCurrency(g.current_amount)}</strong></span>
            <span>Mục tiêu: <strong>{formatCurrency(g.target_amount)}</strong></span>
          </div>
          {!completed && remaining > 0 && dailyNeeded > 0 && (
            <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
              💡 Cần <strong className="text-indigo-600">{formatCurrency(Math.ceil(dailyNeeded))}/ngày</strong> để đúng hạn
            </p>
          )}
          {!completed
            ? <button onClick={() => setShowDeposit(true)}
                className="w-full py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors">
                ＋ Nạp tiền tiết kiệm
              </button>
            : <div className="w-full py-2 bg-green-50 text-green-700 rounded-lg text-sm font-semibold text-center">✅ Đã hoàn thành!</div>
          }
        </div>
      </div>

      {/* Deposit Modal */}
      <Modal open={showDeposit} onClose={() => setShowDeposit(false)} title={`Nạp tiền – ${g.name}`} size="sm">
        <div className="space-y-4">
          <div className="bg-indigo-50 rounded-xl p-4 text-sm space-y-1">
            <div className="flex justify-between text-indigo-700"><span>Hiện có</span><strong>{formatCurrency(g.current_amount)}</strong></div>
            <div className="flex justify-between text-indigo-700"><span>Còn thiếu</span><strong>{formatCurrency(Math.max(remaining,0))}</strong></div>
            <div className="flex justify-between text-indigo-900 font-semibold border-t border-indigo-200 pt-1 mt-1"><span>Mục tiêu</span><span>{formatCurrency(g.target_amount)}</span></div>
          </div>
          <Input label="Số tiền nạp (VND)" type="number" value={depositAmt}
            onChange={(e) => setDepositAmt(e.target.value)} leftAddon="₫" placeholder="0" min={1000} hint="Tối thiểu 1.000₫" />
          <div className="flex gap-2 flex-wrap">
            {QUICK.map((a) => (
              <button key={a} onClick={() => setDepositAmt(String(a))}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${depositAmt===String(a)?"bg-indigo-600 text-white border-indigo-600":"bg-white text-gray-700 border-gray-200 hover:border-indigo-400"}`}>
                {a>=1_000_000?`${a/1_000_000}M`:`${a/1_000}K`}
              </button>
            ))}
            {remaining > 0 && (
              <button onClick={() => setDepositAmt(String(Math.ceil(remaining)))}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-green-300 text-green-700 hover:bg-green-50">
                Hoàn thành
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowDeposit(false)}>Huỷ</Button>
            <Button className="flex-1" loading={loading} onClick={() => void handleDeposit()}>Nạp tiền 💰</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Chỉnh sửa mục tiêu" size="sm">
        <div className="space-y-4">
          <Input label="Tên mục tiêu" value={editName} onChange={(e) => setEditName(e.target.value)} required />
          <Input label="Số tiền mục tiêu" type="number" value={editAmt}
            onChange={(e) => setEditAmt(e.target.value)} leftAddon="₫" required min={1000} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngày hoàn thành</label>
            <input type="date" value={editDL} onChange={(e) => setEditDL(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <Select label="Độ ưu tiên" value={editPri} onChange={(e) => setEditPri(e.target.value)}
            options={[{value:1,label:"⚪ Thấp"},{value:2,label:"🟡 Trung bình"},{value:3,label:"🔴 Cao"}]} />
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowEdit(false)}>Huỷ</Button>
            <Button className="flex-1" loading={loading} onClick={() => void handleEdit()}>Lưu thay đổi</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
