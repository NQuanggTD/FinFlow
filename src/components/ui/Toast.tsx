"use client";

import { useState, useCallback, createContext, useContext, useRef } from "react";
import { cn } from "@/lib/utils/cn";

type ToastType = "success" | "error" | "info" | "warning";
interface ToastItem { id: number; message: string; type: ToastType; }

interface ToastCtx { toast: (msg: string, type?: ToastType) => void; }
const ToastContext = createContext<ToastCtx>({ toast: () => {} });

const icons:  Record<ToastType, string> = { success: "✅", error: "❌", info: "ℹ️", warning: "⚠️" };
const colors: Record<ToastType, string> = {
  success: "bg-green-50 border-green-200 text-green-800",
  error:   "bg-red-50   border-red-200   text-red-800",
  info:    "bg-blue-50  border-blue-200  text-blue-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);   // ← FIX: useRef keeps value across renders

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++counterRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium",
              "min-w-[260px] max-w-sm",
              "animate-in slide-in-from-right-4 fade-in duration-300",
              colors[t.type]
            )}
          >
            <span>{icons[t.type]}</span>
            <span className="flex-1">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
