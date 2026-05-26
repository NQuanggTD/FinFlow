import type { Metadata } from "next";
export const metadata: Metadata = { title: "AI Tư vấn – FinFlow" };

import { AIInsightPanel } from "@/components/ai/AIInsightPanel";
import { AIChat }         from "@/components/ai/AIChat";

export default function AIInsightPage() {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🤖 AI Tư vấn Tài chính</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Nhận phân tích và lời khuyên cá nhân hoá từ AI dựa trên dữ liệu thực của bạn
        </p>
      </div>

      {!hasOpenAI && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex gap-2">
          <span>⚠️</span>
          <span>
            Chức năng AI chưa được cấu hình. Vui lòng thêm{" "}
            <code className="bg-amber-100 px-1 rounded">OPENAI_API_KEY</code>{" "}
            vào file <code className="bg-amber-100 px-1 rounded">.env.local</code>.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AIInsightPanel />
        <AIChat />
      </div>
    </div>
  );
}
