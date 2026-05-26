"use client";

import { useEffect } from "react";
import { Button }    from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <p className="text-5xl mb-4">⚠️</p>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Đã xảy ra lỗi</h2>
        <p className="text-gray-500 text-sm mb-6">
          {error.message || "Lỗi không xác định. Vui lòng thử lại."}
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => window.location.href = "/dashboard"}>
            Về Dashboard
          </Button>
          <Button onClick={reset}>Thử lại</Button>
        </div>
      </div>
    </div>
  );
}
