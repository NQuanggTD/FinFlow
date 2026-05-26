"use client";

import { useActionState } from "react";
import { useFormStatus }  from "react-dom";
import { changePasswordAction } from "@/actions/auth";
import { Card, CardHeader }     from "@/components/ui/Card";
import { Input }                from "@/components/ui/Input";
import { Button }               from "@/components/ui/Button";

type State = { error?: string; success?: boolean } | null;

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} className="w-full">
      Đổi mật khẩu
    </Button>
  );
}

export function ChangePasswordForm() {
  const [state, action] = useActionState<State, FormData>(changePasswordAction, null);

  return (
    <Card>
      <CardHeader title="🔒 Đổi mật khẩu" subtitle="Cập nhật mật khẩu đăng nhập của bạn" />
      {state?.success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
          ✅ Mật khẩu đã được cập nhật thành công!
        </div>
      )}
      {state?.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          ⚠️ {state.error}
        </div>
      )}
      <form action={action} className="space-y-4">
        <Input name="newPassword" type="password" label="Mật khẩu mới"
          placeholder="Tối thiểu 8 ký tự" required minLength={8} hint="Ít nhất 8 ký tự" />
        <Input name="confirmPassword" type="password" label="Xác nhận mật khẩu mới"
          placeholder="Nhập lại mật khẩu" required minLength={8} />
        <SubmitBtn />
      </form>
    </Card>
  );
}
