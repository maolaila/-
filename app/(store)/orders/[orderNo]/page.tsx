import { notFound } from "next/navigation";

import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/status";
import { formatDateTime, formatMoney } from "@/lib/utils";
import { requireUser } from "@/server/auth";
import { getOrderDetailByNo } from "@/server/services/orders";
import { getSiteSettings } from "@/server/services/settings";
import { orderStatusLabels } from "@/lib/order/status";

type Params = Promise<{ orderNo: string }>;

export default async function OrderDetailPage({ params }: { params: Params }) {
  const [{ orderNo }, user, settings] = await Promise.all([params, requireUser(), getSiteSettings()]);
  const order = await getOrderDetailByNo(user.id, orderNo);
  if (!order) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">订单 {order.orderNo}</h1>
        <p className="mt-1 text-sm text-muted">下单时间：{formatDateTime(order.createdAt)}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="grid gap-6">
          <div className="rounded-md border border-line bg-white p-5">
            <div className="flex flex-wrap gap-3">
              <OrderStatusBadge status={order.status} />
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
              <div>
                <div className="text-muted">收货人</div>
                <div className="mt-1 font-medium">{order.receiverName}</div>
              </div>
              <div>
                <div className="text-muted">联系方式</div>
                <div className="mt-1 font-medium">{order.receiverContact}</div>
              </div>
              <div>
                <div className="text-muted">物流</div>
                <div className="mt-1 font-medium">
                  {order.shippingCompany ? `${order.shippingCompany} ${order.shippingNo ?? ""}` : "待填写"}
                </div>
              </div>
            </div>
            <div className="mt-4 text-sm">
              <div className="text-muted">收货地址</div>
              <div className="mt-1">{order.receiverAddress}</div>
            </div>
          </div>

          <div className="overflow-hidden rounded-md border border-line bg-white">
            {order.items.map((item) => (
              <div className="grid grid-cols-[72px_1fr] gap-3 border-b border-line p-4 last:border-b-0 md:grid-cols-[80px_1fr_120px] md:gap-4" key={item.id}>
                <div className="aspect-square overflow-hidden rounded-md bg-slate-100">
                  <img alt={item.productName} className="h-full w-full object-cover" src={item.productImageUrl} />
                </div>
                <div className="min-w-0">
                  <div className="font-medium">{item.productName}</div>
                  <div className="mt-1 text-sm text-muted">
                    {Object.entries(item.variantSnapshot)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(" / ") || "默认规格"}
                  </div>
                  <div className="mt-2 text-sm text-muted">
                    {formatMoney(item.unitPrice, settings.currency)} × {item.quantity}
                  </div>
                </div>
                <div className="col-span-2 font-semibold md:col-span-1">{formatMoney(item.subtotal, settings.currency)}</div>
              </div>
            ))}
          </div>
        </section>

        <aside className="grid h-fit gap-6">
          <div className="rounded-md border border-line bg-white p-5">
            <h2 className="font-semibold">金额</h2>
            <div className="mt-3 text-2xl font-bold text-brand">{formatMoney(order.totalAmount, settings.currency)}</div>
            {order.userNote ? <p className="mt-3 text-sm text-muted">备注：{order.userNote}</p> : null}
            {order.publicNote ? <p className="mt-3 text-sm text-muted">管理员备注：{order.publicNote}</p> : null}
          </div>
          <div className="rounded-md border border-line bg-white p-5">
            <h2 className="font-semibold">状态记录</h2>
            <div className="mt-4 grid gap-3">
              {order.logs.map((log) => (
                <div className="border-l-2 border-brand pl-3 text-sm" key={log.id}>
                  <div className="font-medium">{orderStatusLabels[log.toStatus]}</div>
                  <div className="text-muted">{formatDateTime(log.createdAt)}</div>
                  {log.note ? <div className="text-muted">{log.note}</div> : null}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
