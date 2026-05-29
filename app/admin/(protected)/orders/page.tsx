import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/status";
import type { OrderStatus, PaymentStatus } from "@/db/schema";
import { orderStatusLabels, orderStatuses, paymentStatusLabels, paymentStatuses } from "@/lib/order/status";
import { formatDateTime, formatMoney } from "@/lib/utils";
import { getAdminOrders } from "@/server/services/orders";
import { getSiteSettings } from "@/server/services/settings";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const [orders, settings] = await Promise.all([
    getAdminOrders({
      q: first(params.q),
      status: (first(params.status) as OrderStatus | "all" | undefined) ?? "all",
      paymentStatus: (first(params.paymentStatus) as PaymentStatus | "all" | undefined) ?? "all"
    }),
    getSiteSettings()
  ]);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">订单管理</h1>
        <p className="mt-1 text-sm text-muted">查询订单、维护订单状态、付款状态和物流信息。</p>
      </div>
      <form className="grid gap-3 rounded-md border border-line bg-white p-4 md:grid-cols-[1fr_180px_180px_auto]">
        <input className="h-10 rounded-md border border-line px-3" defaultValue={first(params.q) ?? ""} name="q" placeholder="订单号、顾客、联系方式" />
        <Select defaultValue={first(params.status) ?? "all"} name="status">
          <option value="all">全部订单状态</option>
          {orderStatuses.map((status) => (
            <option key={status} value={status}>
              {orderStatusLabels[status]}
            </option>
          ))}
        </Select>
        <Select defaultValue={first(params.paymentStatus) ?? "all"} name="paymentStatus">
          <option value="all">全部付款状态</option>
          {paymentStatuses.map((status) => (
            <option key={status} value={status}>
              {paymentStatusLabels[status]}
            </option>
          ))}
        </Select>
        <Button>筛选</Button>
      </form>
      <section className="overflow-auto rounded-md border border-line bg-white">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="bg-wash text-muted">
            <tr>
              <th className="px-4 py-3">订单号</th>
              <th className="px-4 py-3">顾客</th>
              <th className="px-4 py-3">收货人</th>
              <th className="px-4 py-3">金额</th>
              <th className="px-4 py-3">订单状态</th>
              <th className="px-4 py-3">付款状态</th>
              <th className="px-4 py-3">下单时间</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr className="border-t border-line" key={order.id}>
                <td className="px-4 py-3 font-medium">{order.orderNo}</td>
                <td className="px-4 py-3">{order.username}</td>
                <td className="px-4 py-3">{order.receiverName}</td>
                <td className="px-4 py-3">{formatMoney(order.totalAmount, settings.currency)}</td>
                <td className="px-4 py-3"><OrderStatusBadge status={order.status} /></td>
                <td className="px-4 py-3"><PaymentStatusBadge status={order.paymentStatus} /></td>
                <td className="px-4 py-3">{formatDateTime(order.createdAt)}</td>
                <td className="px-4 py-3">
                  <Link className="font-medium text-brand" href={`/admin/orders/${order.id}`}>
                    查看
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
