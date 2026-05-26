"use client";

import { useState }        from "react";
import { createClient }    from "@/lib/supabase/client";
import { Input }           from "@/components/ui/Input";
import { Select }          from "@/components/ui/Select";
import { Button }          from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { useToast }        from "@/components/ui/Toast";
import type { ProfileRow } from "@/types/database";

// ── Avatar ─────────────────────────────────────────────────────────
function AvatarUploader({ userId, currentUrl, fullName }: { userId: string; currentUrl: string | null; fullName: string }) {
  const [url,     setUrl    ] = useState(currentUrl);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const initials = fullName
    ? fullName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2)
    : userId.slice(0,2).toUpperCase();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast("Ảnh tối đa 10MB", "error"); return; }
    setLoading(true);

    const fd = new FormData(); fd.append("file", file);
    fd.append("bucket", "avatars");
    const res  = await fetch("/api/upload/receipt", { method: "POST", body: fd });
    const data = await res.json() as { url?: string; error?: string };

    if (data.url) {
      const sb = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (sb.from("profiles") as any).update({ avatar_url: data.url }).eq("id", userId);
      setUrl(data.url);
      toast("Đã cập nhật ảnh đại diện ✅", "success");
    } else toast(data.error ?? "Lỗi upload ảnh", "error");
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-100">
      {url
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={url} alt="Avatar" className="w-16 h-16 rounded-full object-cover border-2 border-indigo-200" />
        : <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl font-bold border-2 border-indigo-200">{initials}</div>
      }
      <div>
        <label className={`cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors ${loading ? "opacity-50 cursor-not-allowed" : ""}`}>
          <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={(e) => void handleFile(e)} disabled={loading} />
          {loading ? "⏳ Đang tải..." : "📷 Đổi ảnh đại diện"}
        </label>
        <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF, WEBP · tối đa 10MB</p>
      </div>
    </div>
  );
}

// ── Main form ───────────────────────────────────────────────────────
export function SettingsForm({ profile, userId }: { profile: ProfileRow | null; userId: string }) {
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [currency, setCurrency] = useState(profile?.currency ?? "VND");
  const [timezone, setTimezone] = useState(profile?.timezone ?? "Asia/Ho_Chi_Minh");
  const [loading,  setLoading ] = useState(false);
  const { toast } = useToast();

  async function handleSave() {
    setLoading(true);
    const sb = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (sb.from("profiles") as any).upsert({
      id: userId, full_name: fullName, currency, timezone,
    });
    setLoading(false);
    if (error) toast("Lỗi khi lưu thông tin", "error");
    else toast("Đã lưu thông tin! ✅", "success");
  }

  return (
    <Card>
      <CardHeader title="👤 Thông tin cá nhân" subtitle="Cập nhật tên, ảnh và tuỳ chọn" />
      <AvatarUploader userId={userId} currentUrl={profile?.avatar_url ?? null} fullName={fullName} />
      <div className="space-y-4">
        <Input label="Họ và tên" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nguyễn Văn A" />
        <Select label="Đơn vị tiền tệ" value={currency} onChange={(e) => setCurrency(e.target.value)}
          options={[
            { value: "VND", label: "🇻🇳 VND – Đồng Việt Nam" },
            { value: "USD", label: "🇺🇸 USD – US Dollar"       },
            { value: "EUR", label: "🇪🇺 EUR – Euro"             },
          ]} />
        <Select label="Múi giờ" value={timezone} onChange={(e) => setTimezone(e.target.value)}
          options={[
            { value: "Asia/Ho_Chi_Minh", label: "🇻🇳 Việt Nam (UTC+7)"        },
            { value: "Asia/Bangkok",     label: "🇹🇭 Bangkok (UTC+7)"           },
            { value: "Asia/Singapore",   label: "🇸🇬 Singapore (UTC+8)"        },
            { value: "Asia/Tokyo",       label: "🇯🇵 Tokyo (UTC+9)"            },
            { value: "Asia/Seoul",       label: "🇰🇷 Seoul (UTC+9)"            },
            { value: "Asia/Shanghai",    label: "🇨🇳 Trung Quốc (UTC+8)"      },
            { value: "Europe/London",    label: "🇬🇧 London (UTC+0/+1)"        },
            { value: "Europe/Paris",     label: "🇫🇷 Paris (UTC+1/+2)"         },
            { value: "America/New_York", label: "🇺🇸 New York (UTC-5/-4)"      },
            { value: "America/Los_Angeles", label: "🇺🇸 Los Angeles (UTC-8/-7)" },
            { value: "Australia/Sydney", label: "🇦🇺 Sydney (UTC+10/+11)"     },
          ]} />
        <Button onClick={() => void handleSave()} loading={loading}>Lưu thay đổi</Button>
      </div>
    </Card>
  );
}
