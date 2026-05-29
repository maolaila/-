import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/status";
import { formatDateTime, formatMoney } from "@/lib/utils";
import { requireUser } from "@/server/auth";
import { getCustomerOrders } from "@/server/services/orders";
import { getSiteSettings } from "@/server/services/settings";

export default async function OrdersPage() {
  const user = await requireUser();
  const [orders, settings] = await Promise.all([getCustomerOrders(user.id), getSiteSettings()]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">我的订单</h1>
        <p className="mt-1 text-sm text-muted">只能查看当前账号提交的订单。</p>
      </div>
      {orders.length === 0 ? (
        <EmptyState title="暂无订单" description="提交订单后会在这里显示处理状态。" />
      ) : (
        <div className="overflow-hidden rounded-md border border-line bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-wash text-muted">
              <tr>
                <th className="px-4 py-3">订单号</th>
                <th className="px-4 py-3">下单时间</th>
                <th className="px-4 py-3">商品数</th>
                <th className="px-4 py-3">金额</th>
                <th className="px-4 py-3">订单状态</th>
                <th className="px-4 py-3">付款状态</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr className="border-t border-line" key={order.id}>
                  <td className="px-4 py-3 font-medium">{order.orderNo}</td>
                  <td className="px-4 py-3">{formatDateTime(order.createdAt)}</td>
                  <td className="px-4 py-3">{order.itemCount}</td>
                  <td className="px-4 py-3">{formatMoney(order.totalAmount, settings.currency)}</td>
                  <td className="px-4 py-3"><OrderStatusBadge status={order.status} /></td>
                  <td className="px-4 py-3"><PaymentStatusBadge status={order.paymentStatus} /></td>
                  <td className="px-4 py-3">
                    <Link className="font-medium text-brand" href={`/orders/${order.orderNo}`}>
                      查看
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
