"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter }                         from "next/navigation";
import { createCategoryAction, deleteCategoryAction } from "@/actions/categories";
import { createClient }                      from "@/lib/supabase/client";
import { Card, CardHeader }                  from "@/components/ui/Card";
import { Input }                             from "@/components/ui/Input";
import { Select }                            from "@/components/ui/Select";
import { Button }                            from "@/components/ui/Button";
import { useToast }                          from "@/components/ui/Toast";
import { cn }                               from "@/lib/utils/cn";
import type { CategoryRow }                  from "@/types/database";

const ICONS   = ["🍜","🚗","🏠","🛍️","🎮","💊","📚","📱","💡","✈️","⚽","💰","💳","🎁","🏦","💼","🎵","🐾","🌿","💅","🎨","🍕","☕","🎯","💎","🎪","🏋️","🎭"];
const COLORS  = ["#4F46E5","#EF4444","#F59E0B","#10B981","#3B82F6","#8B5CF6","#EC4899","#06B6D4","#84CC16","#F97316"];

// Guard: if icon is a word (Lucide name) not an emoji, show default
function safeIcon(icon: string): string {
  if (!icon) return "💳";
  // Emoji check: if first char code > 255, it's likely an emoji
  const code = icon.codePointAt(0) ?? 0;
  if (code > 255) return icon;
  // It's a text/word (bad data) - return default
  return "💳";
}

export function CategoryManager() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [name,    setName   ] = useState("");
  const [icon,    setIcon   ] = useState("💳");
  const [type,    setType   ] = useState<"expense"|"income">("expense");
  const [color,   setColor  ] = useState("#4F46E5");
  const [loading, setLoading] = useState(false);
  const [fetching,setFetching] = useState(true);
  const [tab,     setTab    ] = useState<"expense"|"income">("expense");
  const { toast } = useToast();
  const router    = useRouter();

  const loadCategories = useCallback(async () => {
    setFetching(true);
    const sb = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (sb.from("categories") as any).select("*").order("name");
    setCategories((data ?? []) as CategoryRow[]);
    setFetching(false);
  }, []);

  useEffect(() => { void loadCategories(); }, [loadCategories]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast("Vui lòng nhập tên danh mục", "error"); return; }
    setLoading(true);
    const fd = new FormData();
    fd.set("name", name.trim()); fd.set("icon", icon);
    fd.set("type", type); fd.set("color", color);
    const res = await createCategoryAction(fd);
    setLoading(false);
    if ("error" in res) toast(res.error ?? "Lỗi tạo danh mục", "error");
    else {
      toast(`Đã tạo danh mục "${name.trim()}"! ✅`, "success");
      setName(""); setTab(type);
      await loadCategories(); router.refresh();
    }
  }

  async function handleDelete(id: string, catName: string, isDefault: boolean) {
    if (isDefault) { toast("Không thể xóa danh mục mặc định", "warning"); return; }
    if (!confirm(`Xóa danh mục "${catName}"?`)) return;
    const res = await deleteCategoryAction(id);
    if ("error" in res) toast(res.error ?? "Lỗi xóa", "error");
    else { toast("Đã xóa danh mục", "success"); setCategories(p => p.filter(c => c.id !== id)); }
  }

  const displayed   = categories.filter(c => c.type === tab);
  const userCats    = displayed.filter(c => c.user_id !== null);
  const defaultCats = displayed.filter(c => c.user_id === null);

  return (
    <Card>
      <CardHeader title="🏷️ Danh mục giao dịch" subtitle="Quản lý danh mục tuỳ chỉnh của bạn" />

      <div className="flex border border-gray-200 rounded-lg overflow-hidden mb-5">
        {(["expense","income"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("flex-1 py-2 text-sm font-medium transition-colors",
              tab===t ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50")}>
            {t==="expense" ? "📉 Chi tiêu" : "📈 Thu nhập"}
          </button>
        ))}
      </div>

      {fetching ? (
        <div className="text-center py-6 text-gray-400 text-sm">Đang tải danh mục...</div>
      ) : (
        <>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Danh mục mặc định ({defaultCats.length})
          </p>
          <div className="flex flex-wrap gap-2 mb-5">
            {defaultCats.map(c => (
              <span key={c.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                {safeIcon(c.icon)} {c.name}
              </span>
            ))}
          </div>

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Danh mục của bạn ({userCats.length})
          </p>
          <div className="flex flex-wrap gap-2 mb-5 min-h-[32px]">
            {userCats.length === 0
              ? <span className="text-xs text-gray-400 italic">Chưa có danh mục tuỳ chỉnh</span>
              : userCats.map(c => (
                <span key={c.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border group"
                  style={{ borderColor: c.color+"60", backgroundColor: c.color+"18", color: c.color }}>
                  {safeIcon(c.icon)} {c.name}
                  <button onClick={() => void handleDelete(c.id, c.name, c.is_default)}
                    className="opacity-0 group-hover:opacity-100 ml-0.5 hover:text-red-600 transition-all text-[10px]">
                    ✕
                  </button>
                </span>
              ))
            }
          </div>
        </>
      )}

      {/* Add form */}
      <div className="border-t border-gray-100 pt-5">
        <p className="text-sm font-semibold text-gray-700 mb-3">Thêm danh mục mới</p>
        <form onSubmit={(e) => void handleAdd(e)} className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input label="Tên danh mục" value={name} onChange={e=>setName(e.target.value)}
                placeholder="VD: Cà phê, Gym..." required maxLength={50} />
            </div>
            <Select label="Loại" value={type} onChange={e=>setType(e.target.value as "expense"|"income")}
              options={[{value:"expense",label:"Chi tiêu"},{value:"income",label:"Thu nhập"}]} />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-1.5">Biểu tượng</p>
            <div className="flex flex-wrap gap-1.5">
              {ICONS.map(ic => (
                <button key={ic} type="button" onClick={() => setIcon(ic)}
                  className={cn("w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all",
                    icon===ic ? "bg-indigo-100 ring-2 ring-indigo-500 scale-110" : "bg-gray-100 hover:bg-gray-200")}>
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-1.5">Màu sắc</p>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(cl => (
                <button key={cl} type="button" onClick={() => setColor(cl)}
                  className={cn("w-7 h-7 rounded-full transition-all",
                    color===cl ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "hover:scale-110")}
                  style={{ backgroundColor: cl }} />
              ))}
            </div>
          </div>

          {name.trim() && (
            <div className="flex items-center gap-2 py-1">
              <span className="text-xs text-gray-500">Xem trước:</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ backgroundColor: color+"20", color, border: `1px solid ${color}60` }}>
                {icon} {name.trim()}
              </span>
            </div>
          )}
          <Button type="submit" variant="outline" loading={loading}>＋ Thêm danh mục</Button>
        </form>
      </div>
    </Card>
  );
}
