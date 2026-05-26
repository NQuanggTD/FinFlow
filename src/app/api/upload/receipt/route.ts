import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const MAX_SIZE_RECEIPT = 5 * 1024 * 1024; // 5 MB
const MAX_SIZE_AVATAR  = 10 * 1024 * 1024; // 10 MB
const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic"];

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let formData: FormData;
  try { formData = await req.formData(); }
  catch { return NextResponse.json({ error: "Invalid form data" }, { status: 400 }); }

  const file   = formData.get("file");
  const bucket = (formData.get("bucket") as string) ?? "receipts"; // "receipts" | "avatars"

  if (!file || !(file instanceof File))
    return NextResponse.json({ error: "Không tìm thấy file" }, { status: 400 });

  const maxSize = bucket === "avatars" ? MAX_SIZE_AVATAR : MAX_SIZE_RECEIPT;
  if (file.size > maxSize)
    return NextResponse.json({ error: `File quá lớn. Tối đa ${maxSize/1024/1024}MB.` }, { status: 400 });

  if (!ALLOWED.includes(file.type))
    return NextResponse.json({ error: "Chỉ chấp nhận ảnh JPG, PNG, WEBP, HEIC." }, { status: 400 });

  const ext  = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = bucket === "avatars"
    ? `${user.id}/avatar.${ext}`              // overwrite same path
    : `${user.id}/${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type, upsert: bucket === "avatars" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return NextResponse.json({ url: publicUrl, path: data.path });
}
