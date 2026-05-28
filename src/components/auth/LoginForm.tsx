"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction } from "@/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type State = { error?: string } | null;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" size="lg" loading={pending}>
      Sign in
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState<State, FormData>(
    loginAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
          <span>⚠️</span> {state.error}
        </div>
      )}
      <Input
        name="email"
        type="email"
        label="Email"
        placeholder="you@example.com"
        required
        leftAddon="✉️"
        autoComplete="email"
      />
      <Input
        name="password"
        type="password"
        label="Password"
        placeholder="••••••••"
        required
        leftAddon="🔒"
        autoComplete="current-password"
      />
      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
          <input type="checkbox" className="rounded accent-indigo-600" />
          Remember me
        </label>
        <a
          href="/forgot-password"
          className="text-indigo-600 hover:underline text-sm"
        >
          Forgot password?
        </a>
      </div>
      <SubmitButton />
    </form>
  );
}
