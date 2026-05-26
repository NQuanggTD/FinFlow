"use client";

import { useState } from "react";

const CIRCUMFERENCE = 2 * Math.PI * 15.9;

export function FlowScoreCard({ score: initScore }: { score: number }) {
  const [score,   setScore  ] = useState(initScore);
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg    ] = useState("");

  const hasScore  = score > 0;
  const pct       = Math.min(Math.max(score, 0), 100);
  const offset    = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE;
  const color     = !hasScore ? "#9CA3AF" : pct>=70 ? "#16A34A" : pct>=40 ? "#F59E0B" : "#EF4444";
  const textColor = !hasScore ? "text-gray-400" : pct>=70 ? "text-green-600" : pct>=40 ? "text-amber-500" : "text-red-500";
  const label     = !hasScore ? "Chưa có dữ liệu" : pct>=70 ? "Tốt 👍" : pct>=40 ? "Trung bình ⚠️" : "Cần cải thiện 🔴";

  async function recalculate() {
    setLoading(true); setMsg("");
    try {
      const res  = await fetch("/api/flow-score", { method: "POST" });
      const data = await res.json() as { score?: number; error?: string };
      if (data.score !== undefined) { setScore(data.score); setMsg(`Đã cập nhật: ${data.score} điểm`); }
      else setMsg(data.error ?? "Lỗi tính toán");
    } catch { setMsg("Lỗi kết nối"); }
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-full flex flex-col items-center justify-center">
      <p className="text-gray-500 text-sm font-medium mb-4">Flow Score</p>

      {/* Circular chart */}
      <div className="relative w-32 h-32 mb-4">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E5E7EB" strokeWidth="3" />
          <circle cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="3"
            strokeDasharray={CIRCUMFERENCE} strokeDashoffset={hasScore ? offset : CIRCUMFERENCE}
            strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.8s ease" }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-3xl font-bold ${textColor}`}>{hasScore ? Math.round(pct) : "—"}</span>
        </div>
      </div>

      <p className={`font-semibold text-sm ${textColor}`}>{label}</p>
      <p className="text-gray-400 text-xs mt-1 mb-3">Điểm sức khỏe tài chính</p>

      {!hasScore && (
        <p className="text-xs text-gray-400 text-center max-w-[160px] mb-3">
          Thêm giao dịch để AI tính điểm
        </p>
      )}

      <button onClick={() => void recalculate()} disabled={loading}
        className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline disabled:opacity-50 transition-colors">
        {loading ? "Đang tính..." : "🔄 Tính lại điểm"}
      </button>
      {msg && <p className="text-xs text-gray-500 mt-1">{msg}</p>}
    </div>
  );
}
