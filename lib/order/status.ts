import type { OrderStatus, PaymentStatus } from "@/db/schema";

export const orderStatuses = [
  "pending_confirm",
  "confirmed",
  "purchasing",
  "ready_to_ship",
  "shipped",
  "completed",
  "cancelled",
  "exception"
] as const satisfies readonly OrderStatus[];

export const paymentStatuses = [
  "unpaid",
  "deposit_paid",
  "paid",
  "need_extra_payment",
  "refunded"
] as const satisfies readonly PaymentStatus[];

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending_confirm: "待确认",
  confirmed: "已确认",
  purchasing: "处理中",
  ready_to_ship: "待发货",
  shipped: "已发货",
  completed: "已完成",
  cancelled: "已取消",
  exception: "异常"
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  unpaid: "未付款",
  deposit_paid: "已付定金",
  paid: "已付全款",
  need_extra_payment: "需补款",
  refunded: "已退款"
};

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending_confirm: ["confirmed", "cancelled"],
  confirmed: ["purchasing", "exception"],
  purchasing: ["ready_to_ship", "exception"],
  ready_to_ship: ["shipped", "exception"],
  shipped: ["completed"],
  completed: [],
  cancelled: [],
  exception: ["confirmed", "purchasing", "cancelled"]
};

export function canTransitionOrder(from: OrderStatus, to: OrderStatus) {
  if (from === to) {
    return true;
  }
  return allowedTransitions[from]?.includes(to) ?? false;
}

export function assertValidOrderTransition(from: OrderStatus, to: OrderStatus) {
  if (!canTransitionOrder(from, to)) {
    throw new Error(`订单状态不允许从 ${orderStatusLabels[from]} 变更为 ${orderStatusLabels[to]}`);
  }
}
