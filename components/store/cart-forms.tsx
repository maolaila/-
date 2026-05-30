"use client";

import { useActionState, useState } from "react";
import { Minus, Plus, RefreshCw } from "lucide-react";

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
  const safeMax = Math.max(1, stock);
  const [currentQuantity, setCurrentQuantity] = useState(() => clampQuantity(quantity, safeMax));

  function updateQuantity(nextValue: number) {
    setCurrentQuantity(clampQuantity(nextValue, safeMax));
  }

  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="cartItemId" value={cartItemId} />
      <div className="flex items-center gap-2">
        <span className="inline-flex overflow-hidden rounded-md border border-line bg-white">
          <button
            aria-label="减少数量"
            className="grid h-9 w-9 place-items-center border-r border-line hover:bg-wash disabled:cursor-not-allowed disabled:opacity-45"
            disabled={currentQuantity <= 1}
            onClick={() => updateQuantity(currentQuantity - 1)}
            type="button"
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            className="h-9 w-14 text-center outline-none"
            max={safeMax}
            min={1}
            name="quantity"
            onChange={(event) => updateQuantity(Number(event.target.value))}
            type="number"
            value={currentQuantity}
          />
          <button
            aria-label="增加数量"
            className="grid h-9 w-9 place-items-center border-l border-line hover:bg-wash disabled:cursor-not-allowed disabled:opacity-45"
            disabled={currentQuantity >= safeMax}
            onClick={() => updateQuantity(currentQuantity + 1)}
            type="button"
          >
            <Plus className="h-4 w-4" />
          </button>
        </span>
        <Button className="h-9 px-3" disabled={pending || currentQuantity === quantity} type="submit" variant="secondary" title="更新数量">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <span className="text-xs text-muted">库存 {stock} 件</span>
      {state.message ? <span className="text-xs text-red-600">{state.ok ? "" : state.message}</span> : null}
    </form>
  );
}

function clampQuantity(value: number, max: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }
  return Math.min(Math.max(1, Math.trunc(value)), max);
}
