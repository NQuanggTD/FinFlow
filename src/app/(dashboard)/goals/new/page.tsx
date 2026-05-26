"use client";

import { useState }          from "react";
import { useRouter }         from "next/navigation";
import { createGoalAction }  from "@/actions/goals";
import { Input }             from "@/components/ui/Input";
import { Select }            from "@/components/ui/Select";
import { Button }            from "@/components/ui/Button";
import { useToast }          from "@/components/ui/Toast";
import { formatCurrency }    from "@/lib/utils/format";
import Link                  from "next/link";

export default function NewGoalPage() {
  const router  = useRouter();
  const { toast } = useToast();

  const [name,     setName    ] = useState("");
  const [amount,   setAmount  ] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("1");
  const [loading,  setLoading ] = useState(false);

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim())    { toast("Vui lòng nhập tên mục tiêu",   "error"); return; }
    if (!amount || Number(amount) <= 0) { toast("Vui lòng nhập số tiền hợp lệ", "error"); return; }
    if (!deadline)       { toast("Vui lòng chọn ngày hoàn thành", "error"); return; }

    setLoading(true);
    const fd = new FormData();
    fd.set("name",          name.trim());
    fd.set("target_amount", amount);
    fd.set("deadline",      deadline);
    fd.set("priority",      priority);

    const result = await createGoalAction(fd);
    setLoading(false);

    if ("error" in result) toast(result.error ?? "Lỗi tạo mục tiêu", "error");
    else { toast("Đã tạo mục tiêu! ⭐", "success"); router.push("/goals"); }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/goals" className="text-gray-400 hover:text-gray-600 transition-colors text-sm">← Quay lại</Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tạo mục tiêu mới</h1>
          <p className="text-gray-500 text-sm mt-0.5">Đặt mục tiêu tài chính và theo dõi tiến trình</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
          <Input
            label="Tên mục tiêu" required
            value={name} onChange={(e) => setName(e.target.value)}
            placeholder="VD: Mua iPhone 16, Du lịch Nhật Bản, Quỹ khẩn cấp..."
            hint="Tối đa 100 ký tự"
          />

          <div>
            <Input
              label="Số tiền cần đạt (VND)" required type="number"
              value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder="0" min={10000} leftAddon="₫"
            />
            {amount && Number(amount) > 0 && (
              <p className="text-xs text-indigo-600 font-medium mt-1">
                = {formatCurrency(Number(amount))}
              </p>
            )}
          </div>

          <Input
            label="Ngày hoàn thành mục tiêu" required type="date"
            value={deadline} onChange={(e) => setDeadline(e.target.value)}
            min={minDate.toISOString().split("T")[0]}
            hint="Chọn ngày bạn muốn đạt được mục tiêu này"
          />

          <Select
            label="Độ ưu tiên"
            value={priority} onChange={(e) => setPriority(e.target.value)}
            options={[
              { value: 1, label: "⚪ Thấp – Không cần vội"         },
              { value: 2, label: "🟡 Trung bình – Quan trọng"       },
              { value: 3, label: "🔴 Cao – Ưu tiên hàng đầu"       },
            ]}
          />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
              Huỷ
            </Button>
            <Button type="submit" className="flex-1" loading={loading}>
              ⭐ Tạo mục tiêu
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
