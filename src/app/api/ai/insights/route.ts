import { createClient } from "@/lib/supabase/server";
import { NextResponse }  from "next/server";

interface TxRow { amount: number; type: string; categories: { name: string } | null; }

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      insights: [
        { type: "tip",     title: "AI chưa được cấu hình",        description: "Thêm OPENAI_API_KEY vào .env.local để bật tính năng phân tích AI.",             action: "Xem file .env.local.example" },
        { type: "tip",     title: "Ghi chép giao dịch hàng ngày", description: "Thói quen ghi chép giúp nhận ra pattern chi tiêu và điều chỉnh kịp thời.",      action: "Dùng nút + Thêm giao dịch" },
        { type: "tip",     title: "Đặt ngân sách danh mục",        description: "Thiết lập hạn mức cho từng danh mục giúp kiểm soát chi tiêu hiệu quả.",         action: "Vào trang Ngân sách" },
        { type: "achievement", title: "Bạn đang dùng FinFlow",    description: "Bước đầu tiên quan trọng nhất là bắt đầu theo dõi tài chính của mình.",          action: undefined },
        { type: "warning", title: "Tỷ lệ tiết kiệm khuyến nghị",  description: "Theo quy tắc 50/30/20: 50% nhu cầu thiết yếu, 30% mong muốn, 20% tiết kiệm.", action: "Thiết lập mục tiêu tiết kiệm" },
      ]
    });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const since = new Date();
  since.setDate(since.getDate() - 30);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from("transactions") as any)
    .select("amount, type, categories(name)")
    .eq("is_deleted", false)
    .gte("date", since.toISOString().split("T")[0]);

  const rows = (data ?? []) as TxRow[];
  type Acc = { expenses: Record<string, number>; totalIncome: number; totalExpense: number };
  const summary = rows.reduce<Acc>(
    (acc, t) => {
      const cat = t.categories?.name ?? "Khác";
      if (t.type === "expense") { acc.expenses[cat] = (acc.expenses[cat] ?? 0) + t.amount; acc.totalExpense += t.amount; }
      else acc.totalIncome += t.amount;
      return acc;
    },
    { expenses: {}, totalIncome: 0, totalExpense: 0 }
  );

  const savingRate = summary.totalIncome > 0
    ? (((summary.totalIncome - summary.totalExpense) / summary.totalIncome) * 100).toFixed(1) : "0";

  const topCats = Object.entries(summary.expenses)
    .sort(([,a],[,b]) => b - a).slice(0,5)
    .map(([n, a]) => `${n}: ${a.toLocaleString()}₫`).join(", ");

  const prompt = `Chuyên gia tư vấn tài chính cá nhân. Phân tích và đưa ra 5 nhận xét bằng tiếng Việt.

Dữ liệu 30 ngày:
- Tổng thu: ${summary.totalIncome.toLocaleString()}₫
- Tổng chi: ${summary.totalExpense.toLocaleString()}₫
- Tỷ lệ tiết kiệm: ${savingRate}%
- Top chi tiêu: ${topCats || "Chưa có dữ liệu"}

Trả về JSON (không thêm text khác):
{"insights":[{"type":"tip","title":"","description":"","action":""}]}
type hợp lệ: "tip","warning","achievement". Đúng 5 phần tử.`;

  try {
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1200, temperature: 0.7,
    });
    const raw     = completion.choices[0]?.message?.content ?? "{}";
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
    const result  = JSON.parse(cleaned) as { insights: unknown[] };
    return NextResponse.json(result);
  } catch (err) {
    console.error("AI insights error:", err);
    return NextResponse.json({
      insights: [
        { type: "warning", title: "AI không khả dụng", description: "Không thể kết nối dịch vụ AI. Kiểm tra OPENAI_API_KEY.", action: undefined },
      ]
    });
  }
}
