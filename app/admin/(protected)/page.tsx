import Link from "next/link";

import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/status";
import { formatDateTime, formatMoney } from "@/lib/utils";
import { getDashboardStats } from "@/server/services/orders";
import { getSiteSettings } from "@/server/services/settings";

export default async function AdminDashboardPage() {
  const [{ stats, recentOrders }, settings] = await Promise.all([getDashboardStats(), getSiteSettings()]);
  const cards = [
    ["今日订单", stats.todayOrders],
    ["待确认订单", stats.pendingOrders],
    ["待处理异常", stats.exceptionOrders],
    ["上架商品", stats.activeProducts],
    ["售罄规格", stats.soldOutVariants],
    ["顾客总数", stats.customers]
  ];

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">数据概览</h1>
        <p className="mt-1 text-sm text-muted">后台核心运营指标和最近订单。</p>
      </div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {cards.map(([label, value]) => (
          <div className="rounded-md border border-line bg-white p-4" key={label}>
            <div className="text-sm text-muted">{label}</div>
            <div className="mt-2 text-2xl font-semibold">{value}</div>
          </div>
        ))}
      </section>
      <section className="overflow-x-auto rounded-md border border-line bg-white">
        <div className="border-b border-line px-4 py-3 font-semibold">最近订单</div>
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-wash text-muted">
            <tr>
              <th className="px-4 py-3">订单号</th>
              <th className="px-4 py-3">顾客</th>
              <th className="px-4 py-3">金额</th>
              <th className="px-4 py-3">订单状态</th>
              <th className="px-4 py-3">付款状态</th>
              <th className="px-4 py-3">下单时间</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order) => (
              <tr className="border-t border-line" key={order.id}>
                <td className="px-4 py-3">
                  <Link className="font-medium text-brand" href={`/admin/orders/${order.id}`}>
                    {order.orderNo}
                  </Link>
                </td>
                <td className="px-4 py-3">{order.username}</td>
                <td className="px-4 py-3">{formatMoney(order.totalAmount, settings.currency)}</td>
                <td className="px-4 py-3"><OrderStatusBadge status={order.status} /></td>
                <td className="px-4 py-3"><PaymentStatusBadge status={order.paymentStatus} /></td>
                <td className="px-4 py-3">{formatDateTime(order.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
