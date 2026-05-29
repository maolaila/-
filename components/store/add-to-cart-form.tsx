"use client";

import { useActionState, useMemo, useState } from "react";
import { ShoppingCart } from "lucide-react";

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
        <input
          className="h-10 w-28 rounded-md border border-line px-3"
          min={1}
          max={Math.max(1, max)}
          name="quantity"
          onChange={(event) => setQuantity(Number(event.target.value))}
          type="number"
          value={quantity}
        />
      </label>
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
