"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

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
  const msg = error?.message ?? "";
  const isUnexpectedResponse = msg.includes(
    "An unexpected response was received from the server",
  );
  // Only treat Next's generic "unexpected response" as a registration
  // success UX when it happens while the user is on the register page.
  useEffect(() => {
    if (!isUnexpectedResponse) return;
    if (typeof window === "undefined") return;
    const pathname = window.location.pathname ?? "";
    const isRegisterPath = pathname.startsWith("/register");
    if (!isRegisterPath) return;
    const t = setTimeout(() => (window.location.href = "/login"), 3000);
    return () => clearTimeout(t);
  }, [isUnexpectedResponse]);

  if (
    isUnexpectedResponse &&
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/register")
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <p className="text-5xl mb-4">✅</p>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Registration successful
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Please check your email to confirm your account. You will be
            redirected to the login page shortly.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/login")}
            >
              Go to login
            </Button>
            <Button onClick={() => (window.location.href = "/")}>Home</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <p className="text-5xl mb-4">⚠️</p>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          An error occurred
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          {error.message || "An unknown error occurred. Please try again."}
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/dashboard")}
          >
            Back to dashboard
          </Button>
          <Button onClick={reset}>Retry</Button>
        </div>
      </div>
    </div>
  );
}
