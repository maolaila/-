import type { OrderStatus, PaymentStatus, ProductStatus } from "@/db/schema";
import { orderStatusLabels, paymentStatusLabels } from "@/lib/order/status";
import { cn } from "@/lib/utils";

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const labels: Record<ProductStatus, string> = {
    draft: "草稿",
    active: "上架",
    inactive: "下架"
  };
  return <Badge tone={status === "active" ? "green" : status === "draft" ? "amber" : "gray"}>{labels[status]}</Badge>;
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const tone = status === "exception" ? "red" : status === "completed" ? "green" : status === "cancelled" ? "gray" : "amber";
  return <Badge tone={tone}>{orderStatusLabels[status]}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const tone = status === "paid" ? "green" : status === "refunded" ? "gray" : status === "unpaid" ? "amber" : "blue";
  return <Badge tone={tone}>{paymentStatusLabels[status]}</Badge>;
}

function Badge({ tone, children }: { tone: "green" | "amber" | "gray" | "red" | "blue"; children: React.ReactNode }) {
  const tones = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    gray: "bg-slate-100 text-slate-700 border-slate-200",
    red: "bg-red-50 text-red-700 border-red-200",
    blue: "bg-sky-50 text-sky-700 border-sky-200"
  };
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium", tones[tone])}>
      {children}
    </span>
  );
}
