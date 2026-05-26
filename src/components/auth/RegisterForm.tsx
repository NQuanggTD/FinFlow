"use client";

import { useActionState } from "react";
import { useFormStatus }  from "react-dom";
import { registerAction } from "@/actions/auth";
import { Input }          from "@/components/ui/Input";
import { Button }         from "@/components/ui/Button";

type State = { error?: string } | null;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full mt-2" size="lg" loading={pending}>
      Tạo tài khoản
    </Button>
  );
}

export function RegisterForm() {
  const [state, formAction] = useActionState<State, FormData>(registerAction, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
          <span>⚠️</span> {state.error}
        </div>
      )}
      <Input name="full_name" label="Họ và tên" placeholder="Nguyễn Văn A" required leftAddon="👤" />
      <Input name="email" type="email" label="Email" placeholder="you@example.com" required leftAddon="✉️" />
      <Input name="password" type="password" label="Mật khẩu" placeholder="Tối thiểu 8 ký tự"
        required leftAddon="🔒" hint="Ít nhất 8 ký tự" />
      <Input name="confirmPassword" type="password" label="Xác nhận mật khẩu"
        placeholder="Nhập lại mật khẩu" required leftAddon="🔒" />
      <SubmitButton />
    </form>
  );
}
