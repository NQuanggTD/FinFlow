import { createClient }  from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface TxRow { amount: number; type: string; }

export async function POST(req: NextRequest) {
  // Lazy-load OpenAI only when API key exists
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { reply: "⚠️ Tính năng AI chưa được cấu hình. Vui lòng thêm OPENAI_API_KEY vào .env.local" },
      { status: 200 }
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body    = await req.json() as { message?: string };
  const message = body.message?.trim();
  if (!message) return NextResponse.json({ error: "Empty message" }, { status: 400 });

  const now   = new Date();
  const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from("transactions") as any)
    .select("amount, type").eq("is_deleted", false).gte("date", start);

  const rows    = (data ?? []) as TxRow[];
  const income  = rows.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = rows.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const saving  = income - expense;

  const systemPrompt = `Bạn là AI tư vấn tài chính cá nhân của FinFlow. Trả lời ngắn gọn, thực tế, thân thiện bằng tiếng Việt. Tối đa 150 từ.

Tài chính tháng ${now.getMonth() + 1}/${now.getFullYear()}:
- Thu nhập: ${income.toLocaleString()}₫
- Chi tiêu: ${expense.toLocaleString()}₫
- Tiết kiệm: ${saving.toLocaleString()}₫
- Tỷ lệ tiết kiệm: ${income > 0 ? ((saving/income)*100).toFixed(1) : 0}%`;

  try {
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: message },
      ],
      max_tokens: 400,
      temperature: 0.8,
    });
    return NextResponse.json({ reply: completion.choices[0]?.message?.content ?? "Xin lỗi, không thể trả lời ngay lúc này." });
  } catch (err) {
    console.error("AI chat error:", err);
    return NextResponse.json({ reply: "❌ Dịch vụ AI tạm thời không khả dụng." });
  }
}
