"use client";

import { useActionState } from "react";
import { RefreshCw } from "lucide-react";

import { updateCartItemAction } from "@/app/actions/cart";
import { emptyActionState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";

export function CartQuantityForm({
  cartItemId,
  quantity,
  stock
}: {
  cartItemId: string;
  quantity: number;
  stock: number;
}) {
  const [state, action, pending] = useActionState(updateCartItemAction, emptyActionState);
  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="cartItemId" value={cartItemId} />
      <div className="flex items-center gap-2">
        <input
          className="h-9 w-20 rounded-md border border-line px-2"
          defaultValue={quantity}
          max={Math.max(1, stock)}
          min={1}
          name="quantity"
          type="number"
        />
        <Button className="h-9 px-3" disabled={pending} type="submit" variant="secondary" title="更新数量">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      {state.message ? <span className="text-xs text-red-600">{state.ok ? "" : state.message}</span> : null}
    </form>
  );
}
