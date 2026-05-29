import Link from "next/link";

import { CheckoutForm } from "@/components/store/checkout-form";
import { EmptyState } from "@/components/ui/empty-state";
import { formatMoney } from "@/lib/utils";
import { requireUser } from "@/server/auth";
import { getCartItems } from "@/server/services/cart";
import { getSiteSettings } from "@/server/services/settings";

export default async function CheckoutPage() {
  const user = await requireUser();
  const [items, settings] = await Promise.all([getCartItems(user.id), getSiteSettings()]);
  const validItems = items.filter(
    (item) => item.productStatus === "active" && item.variantStatus === "active" && item.quantity <= item.stock
  );
  const total = validItems.reduce((sum, item) => sum + Number(item.subtotal), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">结算</h1>
        <p className="mt-1 text-sm text-muted">{settings.orderNotice}</p>
      </div>

      {validItems.length === 0 ? (
        <EmptyState title="没有可结算商品" description="购物车为空或存在库存/状态异常。" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="rounded-md border border-line bg-white p-5">
            <CheckoutForm items={validItems} />
          </section>
          <aside className="h-fit rounded-md border border-line bg-white p-5">
            <h2 className="font-semibold">订单商品</h2>
            <div className="mt-4 grid gap-3">
              {validItems.map((item) => (
                <div className="flex justify-between gap-4 text-sm" key={item.id}>
                  <Link className="min-w-0 flex-1 truncate hover:text-brand" href={`/products/${item.productSlug}`}>
                    {item.productName} × {item.quantity}
                  </Link>
                  <span>{formatMoney(item.subtotal, settings.currency)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-line pt-4 text-lg font-semibold">
              合计 {formatMoney(total, settings.currency)}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
