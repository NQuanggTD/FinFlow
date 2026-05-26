"use client";

import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge }    from "@/components/ui/Badge";
import { Button }   from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import type { AIInsight } from "@/types";

const TYPE_CFG: Record<AIInsight["type"], { icon: string; color: "indigo" | "amber" | "green" }> = {
  tip:         { icon: "💡", color: "indigo" },
  warning:     { icon: "⚠️", color: "amber"  },
  achievement: { icon: "🏆", color: "green"  },
};
const TYPE_LABEL: Record<AIInsight["type"], string> = {
  tip: "Gợi ý", warning: "Cảnh báo", achievement: "Thành tích",
};

export function AIInsightPanel() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading,  setLoading ] = useState(false);
  const [fetched,  setFetched ] = useState(false);
  const [errMsg,   setErrMsg  ] = useState("");

  async function loadInsights() {
    setLoading(true);
    setErrMsg("");
    try {
      const res  = await fetch("/api/ai/insights");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { insights?: AIInsight[]; error?: string };
      if (data.error) throw new Error(data.error);
      setInsights(data.insights ?? []);
      setFetched(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Lỗi không xác định";
      setErrMsg(msg);
    }
    setLoading(false);
  }

  return (
    <Card className="flex flex-col">
      <CardHeader
        title="🤖 Phân tích AI"
        subtitle="Nhận xét chi tiêu & gợi ý cải thiện"
        action={
          <Button size="sm" variant="outline" onClick={loadInsights} loading={loading}>
            {fetched ? "🔄 Làm mới" : "✨ Phân tích"}
          </Button>
        }
      />

      {/* Error state */}
      {errMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-3 flex gap-2">
          <span>❌</span> {errMsg}
        </div>
      )}

      {/* Empty state */}
      {!fetched && !loading && !errMsg && (
        <div className="flex flex-col items-center py-10 text-center">
          <span className="text-5xl mb-3">🤖</span>
          <p className="font-semibold text-gray-800 mb-1">AI sẵn sàng phân tích</p>
          <p className="text-sm text-gray-400 max-w-xs">
            Nhấn "Phân tích" để nhận nhận xét cá nhân hoá dựa trên chi tiêu 30 ngày qua.
          </p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border border-gray-100 rounded-xl space-y-2 animate-pulse">
              <div className="flex gap-2">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-1/2" />
                  <Skeleton className="h-3 w-full"  />
                  <Skeleton className="h-3 w-3/4"   />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Insights list */}
      {!loading && insights.length > 0 && (
        <div className="space-y-3">
          {insights.map((insight, i) => {
            const cfg = TYPE_CFG[insight.type] ?? TYPE_CFG.tip;
            return (
              <div
                key={i}
                className="p-4 border border-gray-100 rounded-xl hover:border-indigo-100 hover:bg-indigo-50/20 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5 flex-shrink-0">{cfg.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm">{insight.title}</p>
                      <Badge label={TYPE_LABEL[insight.type]} color={cfg.color} />
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{insight.description}</p>
                    {insight.action && (
                      <p className="mt-2 text-xs text-indigo-600 font-medium">
                        👉 {insight.action}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
