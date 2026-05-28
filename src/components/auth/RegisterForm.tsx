"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { registerAction } from "@/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type State = { error?: string; success?: boolean; message?: string } | null;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full mt-2" size="lg" loading={pending}>
      Create account
    </Button>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [state, formAction] = useActionState<State, FormData>(
    registerAction,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [isLocked, setIsLocked] = useState(false);
  const lockTimerRef = useRef<number | null>(null);

  const registerError = useMemo(() => {
    if (!state?.error) return null;
    return state.error;
  }, [state?.error]);

  const registerNotice = useMemo(() => {
    if (!state?.success || !state.message) return null;
    if (state.message === "email rate limit exceeded") {
      return "Confirmation email has been sent. Please check your inbox.";
    }
    return state.message;
  }, [state]);

  useEffect(() => {
    if (state?.success) {
      // Give user a short moment to read success message, then go to login.
      const t = setTimeout(
        () =>
          router.push(
            `/login?message=${encodeURIComponent(
              state.message === "email rate limit exceeded"
                ? "Confirmation email has been sent. Please check your inbox."
                : (state.message ??
                    "Please check your email to confirm your account"),
            )}`,
          ),
        1500,
      );
      return () => clearTimeout(t);
    }
  }, [state, router]);

  useEffect(() => {
    if (state?.error || state?.success) {
      // Avoid synchronous setState in effect; defer slightly
      const t = window.setTimeout(() => setIsLocked(false), 0);
      return () => clearTimeout(t);
    }
  }, [state]);

  useEffect(() => {
    return () => {
      if (lockTimerRef.current) window.clearTimeout(lockTimerRef.current);
    };
  }, []);

  const handleSubmit = () => {
    if (isLocked) return;
    setIsLocked(true);
    lockTimerRef.current = window.setTimeout(() => setIsLocked(false), 5000);
  };

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      {registerError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
          <span>⚠️</span> {registerError}
        </div>
      )}
      {registerNotice && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 flex items-start gap-2">
          <span>ℹ️</span>
          <span>{registerNotice}</span>
        </div>
      )}
      {state?.success && !registerNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-sm text-emerald-700 flex items-center gap-2">
          <span>✅</span> Registration successful — please check your
          confirmation email.
        </div>
      )}
      <Input
        name="full_name"
        label="Full name"
        placeholder="John Doe"
        required
        leftAddon="👤"
      />
      <Input
        name="email"
        type="email"
        label="Email"
        placeholder="you@example.com"
        required
        leftAddon="✉️"
      />
      <Input
        name="password"
        type="password"
        label="Password"
        placeholder="At least 8 characters"
        required
        leftAddon="🔒"
        hint="At least 8 characters"
      />
      <Input
        name="confirmPassword"
        type="password"
        label="Confirm password"
        placeholder="Re-enter your password"
        required
        leftAddon="🔒"
      />
      <SubmitButton />
      {isLocked && !state?.success && !state?.error && (
        <p className="text-xs text-gray-400 text-center">
          Processing registration request...
        </p>
      )}
    </form>
  );
}
