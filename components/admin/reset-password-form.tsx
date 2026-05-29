"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";

import { resetCustomerPasswordAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { emptyActionState } from "@/lib/action-state";

export function ResetPasswordForm({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState(resetCustomerPasswordAction, emptyActionState);
  return (
    <form action={action} className="flex min-w-72 items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <Input className="h-9" name="password" maxLength={128} placeholder="新密码" required type="password" />
      <Button className="h-9 px-3" disabled={pending} title="重置密码" type="submit" variant="secondary">
        <KeyRound className="h-4 w-4" />
      </Button>
      {state.message ? <span className="text-xs text-muted">{state.message}</span> : null}
    </form>
  );
}
