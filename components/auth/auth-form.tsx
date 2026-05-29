"use client";

import { useActionState } from "react";
import { LogIn, UserPlus } from "lucide-react";

import { loginAction, registerAction, adminLoginAction } from "@/app/actions/auth";
import { emptyActionState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export function LoginForm({
  redirectTo = "/",
  admin = false
}: {
  redirectTo?: string;
  admin?: boolean;
}) {
  const [state, action, pending] = useActionState(admin ? adminLoginAction : loginAction, emptyActionState);
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="redirect" value={redirectTo} />
      <Field label="账号">
        <Input name="username" autoComplete="username" maxLength={64} required />
      </Field>
      <Field label="密码">
        <Input name="password" type="password" autoComplete="current-password" maxLength={128} required />
      </Field>
      {state.message ? (
        <p className={state.ok ? "text-sm text-emerald-700" : "text-sm text-red-600"}>{state.message}</p>
      ) : null}
      <Button disabled={pending}>
        <LogIn className="h-4 w-4" />
        {pending ? "登录中" : "登录"}
      </Button>
    </form>
  );
}

export function RegisterForm({ redirectTo = "/" }: { redirectTo?: string }) {
  const [state, action, pending] = useActionState(registerAction, emptyActionState);
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="redirect" value={redirectTo} />
      <Field label="账号">
        <Input name="username" autoComplete="username" maxLength={64} required />
      </Field>
      <Field label="密码">
        <Input name="password" type="password" autoComplete="new-password" maxLength={128} required />
      </Field>
      <Field label="确认密码">
        <Input name="confirmPassword" type="password" autoComplete="new-password" maxLength={128} required />
      </Field>
      {state.message ? (
        <p className={state.ok ? "text-sm text-emerald-700" : "text-sm text-red-600"}>{state.message}</p>
      ) : null}
      <Button disabled={pending}>
        <UserPlus className="h-4 w-4" />
        {pending ? "注册中" : "注册并登录"}
      </Button>
    </form>
  );
}
