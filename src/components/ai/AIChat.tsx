"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

interface Message {
  role: "user" | "assistant";
  content: string;
  ts: number;
}

const QUICK_QUESTIONS = [
  "Tháng này tôi có đang tiết kiệm tốt không?",
  "Danh mục nào tôi chi tiêu nhiều nhất?",
  "Làm sao để cắt giảm chi tiêu hiệu quả?",
  "Tôi nên phân bổ ngân sách thế nào?",
];

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  // Initialize assistant greeting after mount to avoid impure calls during render
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessages([
      {
        role: "assistant",
        content:
          "Xin chào! 👋 Tôi là trợ lý tài chính AI của FinFlow. Hãy hỏi tôi bất cứ điều gì về tình hình tài chính của bạn nhé!",
        ts: Date.now(),
      },
    ]);
  }, []);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (text?: string) => {
      const msg = (text ?? input).trim();
      if (!msg || loading) return;

      setMessages((prev) => [
        ...prev,
        { role: "user", content: msg, ts: Date.now() },
      ]);
      setInput("");
      setLoading(true);

      // Reset textarea height
      if (textareaRef.current) textareaRef.current.style.height = "auto";

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: msg }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { reply?: string; error?: string };
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              data.reply ??
              data.error ??
              "Xin lỗi, tôi không thể trả lời ngay lúc này.",
            ts: Date.now(),
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "❌ Lỗi kết nối. Vui lòng thử lại sau.",
            ts: Date.now(),
          },
        ]);
      }
      setLoading(false);
    },
    [input, loading],
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  }

  // Auto-resize textarea
  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
  }

  const showQuick = messages.length <= 1;

  return (
    <Card className="flex flex-col" style={{ height: "520px" }}>
      <CardHeader
        title="💬 Chat với AI"
        subtitle="Hỏi về tài chính cá nhân của bạn"
      />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1 scroll-smooth">
        {messages.map((m) => (
          <div
            key={m.ts}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "assistant" && (
              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs flex-shrink-0 mr-2 mt-1">
                🤖
              </div>
            )}
            <div
              className={cn(
                "max-w-[82%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                m.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-sm"
                  : "bg-gray-100 text-gray-800 rounded-bl-sm",
              )}
            >
              {m.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs flex-shrink-0">
              🤖
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick questions */}
      {showQuick && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => void sendMessage(q)}
              className="text-xs px-2.5 py-1.5 bg-indigo-50 text-indigo-700 rounded-full hover:bg-indigo-100 transition-colors text-left"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex gap-2 items-end mt-auto">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Nhập câu hỏi... (Enter để gửi)"
          rows={1}
          className="flex-1 resize-none rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent overflow-hidden"
          style={{ minHeight: "42px", maxHeight: "100px" }}
        />
        <Button
          onClick={() => void sendMessage()}
          loading={loading}
          disabled={!input.trim()}
          size="md"
          className="flex-shrink-0 h-[42px]"
        >
          Gửi
        </Button>
      </div>
    </Card>
  );
}
