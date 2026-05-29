"use client";

import { useActionState } from "react";
import { ClipboardCheck } from "lucide-react";

import { createOrderAction } from "@/app/actions/order";
import { emptyActionState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import type { CartItemRow } from "@/server/services/cart";

export function CheckoutForm({ items }: { items: CartItemRow[] }) {
  const [state, action, pending] = useActionState(createOrderAction, emptyActionState);
  return (
    <form action={action} className="grid gap-4">
      {items.map((item) => (
        <input key={item.id} type="hidden" name="cartItemIds" value={item.id} />
      ))}
      <Field label="收货人">
        <Input name="receiverName" maxLength={50} required />
      </Field>
      <Field label="联系方式">
        <Input name="receiverContact" maxLength={100} required />
      </Field>
      <Field label="收货地址">
        <Textarea name="receiverAddress" maxLength={300} required />
      </Field>
      <Field label="顾客备注">
        <Textarea name="userNote" maxLength={500} />
      </Field>
      {state.message ? <p className="text-sm text-red-600">{state.message}</p> : null}
      <Button disabled={pending || items.length === 0}>
        <ClipboardCheck className="h-4 w-4" />
        {pending ? "提交中" : "提交订单"}
      </Button>
    </form>
  );
}
