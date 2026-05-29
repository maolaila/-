import { Trash2 } from "lucide-react";
import Link from "next/link";

import { removeCartItemAction, clearCartAction } from "@/app/actions/cart";
import { CartQuantityForm } from "@/components/store/cart-forms";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatMoney } from "@/lib/utils";
import { requireUser } from "@/server/auth";
import { getCartItems } from "@/server/services/cart";
import { getSiteSettings } from "@/server/services/settings";

export default async function CartPage() {
  const user = await requireUser();
  const [items, settings] = await Promise.all([getCartItems(user.id), getSiteSettings()]);
  const total = items.reduce((sum, item) => sum + Number(item.subtotal), 0);
  const hasInvalid = items.some(
    (item) => item.productStatus !== "active" || item.variantStatus !== "active" || item.quantity > item.stock
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">购物车</h1>
          <p className="mt-1 text-sm text-muted">提交订单前会再次校验库存、状态和价格。</p>
        </div>
        {items.length > 0 ? (
          <form action={clearCartAction}>
            <Button type="submit" variant="secondary">
              清空购物车
            </Button>
          </form>
        ) : null}
      </div>

      {items.length === 0 ? (
        <EmptyState title="购物车为空" description="先去商品列表挑选商品。" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="overflow-hidden rounded-md border border-line bg-white">
            {items.map((item) => {
              const invalid =
                item.productStatus !== "active"
                  ? "商品已下架"
                  : item.variantStatus !== "active"
                    ? "规格不可用"
                    : item.quantity > item.stock
                      ? "库存不足"
                      : null;
              return (
                <div className="grid gap-4 border-b border-line p-4 last:border-b-0 md:grid-cols-[96px_1fr_180px_80px]" key={item.id}>
                  <Link className="aspect-square overflow-hidden rounded-md bg-slate-100" href={`/products/${item.productSlug}`}>
                    <img alt={item.productName} className="h-full w-full object-cover" src={item.mainImageUrl} />
                  </Link>
                  <div>
                    <Link className="font-semibold hover:text-brand" href={`/products/${item.productSlug}`}>
                      {item.productName}
                    </Link>
                    <p className="mt-1 text-sm text-muted">
                      {Object.keys(item.optionValues).length > 0
                        ? Object.entries(item.optionValues)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(" / ")
                        : "默认规格"}
                    </p>
                    <p className="mt-2 text-sm font-medium text-brand">{formatMoney(item.unitPrice, settings.currency)}</p>
                    {invalid ? <p className="mt-2 text-sm text-red-600">{invalid}</p> : null}
                  </div>
                  <CartQuantityForm cartItemId={item.id} quantity={item.quantity} stock={item.stock} />
                  <form action={removeCartItemAction}>
                    <input type="hidden" name="cartItemId" value={item.id} />
                    <Button className="h-9 px-3" type="submit" variant="danger" title="删除">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              );
            })}
          </section>
          <aside className="h-fit rounded-md border border-line bg-white p-5">
            <div className="flex justify-between text-sm text-muted">
              <span>商品数量</span>
              <span>{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
            </div>
            <div className="mt-3 flex justify-between text-lg font-semibold">
              <span>合计</span>
              <span>{formatMoney(total, settings.currency)}</span>
            </div>
            {hasInvalid ? <p className="mt-3 text-sm text-red-600">存在不可结算商品，请先调整。</p> : null}
            <ButtonLink className="mt-5 w-full" href="/checkout" variant={hasInvalid ? "secondary" : "primary"}>
              去结算
            </ButtonLink>
          </aside>
        </div>
      )}
    </div>
  );
}
