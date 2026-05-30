"use client";

import { useActionState, useMemo, useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";

import { addToCartAction } from "@/app/actions/cart";
import { emptyActionState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import type { ProductVariant } from "@/server/services/catalog";

export function AddToCartForm({
  productId,
  variants,
  redirectTo
}: {
  productId: string;
  variants: ProductVariant[];
  redirectTo: string;
}) {
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [state, action, pending] = useActionState(addToCartAction, emptyActionState);
  const selected = useMemo(() => variants.find((variant) => variant.id === variantId), [variantId, variants]);
  const max = selected?.stock ?? 1;
  const soldOut = !selected || selected.stock <= 0;
  const safeMax = Math.max(1, max);

  function updateQuantity(nextValue: number) {
    setQuantity(clampQuantity(nextValue, safeMax));
  }

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="variantId" value={variantId} />
      <input type="hidden" name="redirect" value={redirectTo} />
      <div className="grid gap-2">
        <span className="text-sm font-medium">规格</span>
        <div className="flex flex-wrap gap-2">
          {variants.map((variant) => (
            <button
              className={
                variant.id === variantId
                  ? "rounded-md border border-brand bg-teal-50 px-3 py-2 text-sm text-brand"
                  : "rounded-md border border-line bg-white px-3 py-2 text-sm hover:border-brand"
              }
              key={variant.id}
              onClick={() => {
                setVariantId(variant.id);
                setQuantity(1);
              }}
              type="button"
            >
              {Object.keys(variant.optionValues).length > 0
                ? Object.entries(variant.optionValues)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(" / ")
                : "默认规格"}
            </button>
          ))}
        </div>
      </div>
      <label className="grid gap-2 text-sm font-medium">
        数量
        <span className="inline-flex w-fit overflow-hidden rounded-md border border-line bg-white">
          <button
            aria-label="减少数量"
            className="grid h-10 w-10 place-items-center border-r border-line hover:bg-wash disabled:cursor-not-allowed disabled:opacity-45"
            disabled={soldOut || quantity <= 1}
            onClick={() => updateQuantity(quantity - 1)}
            type="button"
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            className="h-10 w-16 text-center outline-none"
            min={1}
            max={safeMax}
            name="quantity"
            onChange={(event) => updateQuantity(Number(event.target.value))}
            type="number"
            value={quantity}
          />
          <button
            aria-label="增加数量"
            className="grid h-10 w-10 place-items-center border-l border-line hover:bg-wash disabled:cursor-not-allowed disabled:opacity-45"
            disabled={soldOut || quantity >= safeMax}
            onClick={() => updateQuantity(quantity + 1)}
            type="button"
          >
            <Plus className="h-4 w-4" />
          </button>
        </span>
      </label>
      {selected ? <p className="text-xs text-muted">当前可购 {selected.stock} 件</p> : null}
      {state.message ? (
        <p className={state.ok ? "text-sm text-emerald-700" : "text-sm text-red-600"}>{state.message}</p>
      ) : null}
      <Button disabled={pending || soldOut}>
        <ShoppingCart className="h-4 w-4" />
        {soldOut ? "已售罄" : pending ? "处理中" : "加入购物车"}
      </Button>
    </form>
  );
}

function clampQuantity(value: number, max: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }
  return Math.min(Math.max(1, Math.trunc(value)), max);
}
