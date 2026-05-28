"use client";

import { useState, useEffect } from "react";
import { Modal }   from "@/components/ui/Modal";
import { Input }   from "@/components/ui/Input";
import { Select }  from "@/components/ui/Select";
import { Button }  from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { upsertBudgetAction } from "@/actions/budgets";
import { createClient }       from "@/lib/supabase/client";
import { useToast }           from "@/components/ui/Toast";

interface Props {
  open:      boolean;
  onClose:   () => void;
  onSuccess: () => void;
  month:     number;
  year:      number;
}

interface Category { id: string; name: string; icon: string; }

const ALERT_OPTIONS = [
  { value: 50,  label: "50% – Cảnh báo sớm"   },
  { value: 70,  label: "70%"                   },
  { value: 80,  label: "80% – Mặc định"        },
  { value: 90,  label: "90% – Cảnh báo muộn"  },
  { value: 100, label: "100% – Khi vượt hạn"  },
];

export function BudgetFormModal({ open, onClose, onSuccess, month, year }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [catLoading, setCatLoading ] = useState(false);
  const [saving,     setSaving     ] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCatLoading(true);
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    void (supabase.from("categories") as any)
      .select("id, name, icon")
      .eq("type", "expense")
      .order("name")
      .then(({ data }: { data: Category[] | null }) => {
        setCategories(data ?? []);
        setCatLoading(false);
      });
  }, [open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const result = await upsertBudgetAction(fd);
    setSaving(false);
    if ("error" in result) toast(result.error ?? "Lỗi không xác định", "error");
    else { toast("Đã lưu ngân sách! 🎯", "success"); onSuccess(); }
  }

  const MONTHS = ["","Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];

  return (
    <Modal open={open} onClose={onClose} title="Thiết lập ngân sách" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="hidden" name="month" value={month} />
        <input type="hidden" name="year"  value={year}  />

        <p className="text-sm text-gray-500 bg-indigo-50 rounded-lg p-3">
          📅 Ngân sách cho <strong>{MONTHS[month]}/{year}</strong>
        </p>

        {catLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <Select
            name="category_id"
            label="Danh mục chi tiêu"
            required
            placeholder="Chọn danh mục..."
            options={categories.map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` }))}
          />
        )}

        <Input
          name="amount_limit"
          type="number"
          label="Hạn mức (VND)"
          placeholder="0"
          required
          min={1000}
          leftAddon="₫"
          hint="Số tiền tối đa được phép chi tiêu trong danh mục này"
        />

        <Select
          name="alert_at_percent"
          label="Cảnh báo khi đạt"
          defaultValue={80}
          options={ALERT_OPTIONS.map((a) => ({ value: a.value, label: a.label }))}
          hint="Nhận thông báo khi chi tiêu đạt % này"
        />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Huỷ</Button>
          <Button type="submit" className="flex-1" loading={saving} disabled={catLoading}>
            Lưu ngân sách
          </Button>
        </div>
      </form>
    </Modal>
  );
}
