import { notFound } from "next/navigation";

import {
  updateOrderNotesAction,
  updateOrderStatusAction,
  updatePaymentStatusAction,
  updateShippingAction
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/status";
import { orderStatusLabels, orderStatuses, paymentStatusLabels, paymentStatuses } from "@/lib/order/status";
import { formatDateTime, formatMoney } from "@/lib/utils";
import { getOrderDetailById } from "@/server/services/orders";
import { getSiteSettings } from "@/server/services/settings";

type Params = Promise<{ id: string }>;

export default async function AdminOrderDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const [order, settings] = await Promise.all([getOrderDetailById(id), getSiteSettings()]);
  if (!order) {
    notFound();
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">订单 {order.orderNo}</h1>
        <p className="mt-1 text-sm text-muted">顾客：{order.username} · {formatDateTime(order.createdAt)}</p>
      </div>

      <section className="grid gap-4 lg:grid-cols-4">
        <div className="rounded-md border border-line bg-white p-4">
          <div className="text-sm text-muted">订单状态</div>
          <div className="mt-2"><OrderStatusBadge status={order.status} /></div>
        </div>
        <div className="rounded-md border border-line bg-white p-4">
          <div className="text-sm text-muted">付款状态</div>
          <div className="mt-2"><PaymentStatusBadge status={order.paymentStatus} /></div>
        </div>
        <div className="rounded-md border border-line bg-white p-4">
          <div className="text-sm text-muted">订单金额</div>
          <div className="mt-2 text-xl font-semibold">{formatMoney(order.totalAmount, settings.currency)}</div>
        </div>
        <div className="rounded-md border border-line bg-white p-4">
          <div className="text-sm text-muted">商品数量</div>
          <div className="mt-2 text-xl font-semibold">{order.items.reduce((sum, item) => sum + item.quantity, 0)}</div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="grid gap-6">
          <div className="overflow-hidden rounded-md border border-line bg-white">
            <div className="border-b border-line px-4 py-3 font-semibold">商品快照</div>
            {order.items.map((item) => (
              <div className="grid gap-4 border-b border-line p-4 last:border-b-0 md:grid-cols-[72px_1fr_120px]" key={item.id}>
                <img alt={item.productName} className="h-16 w-16 rounded-md object-cover" src={item.productImageUrl} />
                <div>
                  <div className="font-medium">{item.productName}</div>
                  <div className="mt-1 text-sm text-muted">
                    {Object.entries(item.variantSnapshot).map(([key, value]) => `${key}: ${value}`).join(" / ") || "默认规格"}
                  </div>
                  <div className="mt-2 text-sm text-muted">{formatMoney(item.unitPrice, settings.currency)} × {item.quantity}</div>
                </div>
                <div className="font-semibold">{formatMoney(item.subtotal, settings.currency)}</div>
              </div>
            ))}
          </div>

          <div className="rounded-md border border-line bg-white p-4">
            <h2 className="font-semibold">收货信息</h2>
            <dl className="mt-3 grid gap-2 text-sm">
              <div><dt className="text-muted">收货人</dt><dd>{order.receiverName}</dd></div>
              <div><dt className="text-muted">联系方式</dt><dd>{order.receiverContact}</dd></div>
              <div><dt className="text-muted">地址</dt><dd>{order.receiverAddress}</dd></div>
              {order.userNote ? <div><dt className="text-muted">顾客备注</dt><dd>{order.userNote}</dd></div> : null}
            </dl>
          </div>

          <div className="rounded-md border border-line bg-white p-4">
            <h2 className="font-semibold">状态日志</h2>
            <div className="mt-4 grid gap-3">
              {order.logs.map((log) => (
                <div className="border-l-2 border-brand pl-3 text-sm" key={log.id}>
                  <div className="font-medium">{orderStatusLabels[log.toStatus]}</div>
                  <div className="text-muted">{formatDateTime(log.createdAt)} · {log.operatorName ?? "系统"}</div>
                  {log.note ? <div className="text-muted">{log.note}</div> : null}
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="grid h-fit gap-4">
          <form action={updateOrderStatusAction} className="rounded-md border border-line bg-white p-4">
            <input type="hidden" name="id" value={order.id} />
            <Field label="修改订单状态">
              <Select name="status" defaultValue={order.status}>
                {orderStatuses.map((status) => (
                  <option key={status} value={status}>
                    {orderStatusLabels[status]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="状态备注">
              <Textarea name="note" />
            </Field>
            <Button className="mt-3">保存状态</Button>
          </form>

          <form action={updatePaymentStatusAction} className="rounded-md border border-line bg-white p-4">
            <input type="hidden" name="id" value={order.id} />
            <Field label="修改付款状态">
              <Select name="paymentStatus" defaultValue={order.paymentStatus}>
                {paymentStatuses.map((status) => (
                  <option key={status} value={status}>
                    {paymentStatusLabels[status]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="付款备注">
              <Textarea name="note" />
            </Field>
            <Button className="mt-3">保存付款</Button>
          </form>

          <form action={updateShippingAction} className="rounded-md border border-line bg-white p-4">
            <input type="hidden" name="id" value={order.id} />
            <Field label="物流公司">
              <Input name="shippingCompany" defaultValue={order.shippingCompany ?? ""} />
            </Field>
            <Field label="物流单号">
              <Input name="shippingNo" defaultValue={order.shippingNo ?? ""} />
            </Field>
            <Button className="mt-3">保存物流</Button>
          </form>

          <form action={updateOrderNotesAction} className="rounded-md border border-line bg-white p-4">
            <input type="hidden" name="id" value={order.id} />
            <Field label="内部备注">
              <Textarea name="adminNote" defaultValue={order.adminNote ?? ""} />
            </Field>
            <Field label="顾客可见备注">
              <Textarea name="publicNote" defaultValue={order.publicNote ?? ""} />
            </Field>
            <Button className="mt-3">保存备注</Button>
          </form>
        </aside>
      </section>
    </div>
  );
}
