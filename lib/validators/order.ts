import { z } from "zod";

import { orderStatuses, paymentStatuses } from "@/lib/order/status";

export const checkoutSchema = z.object({
  cartItemIds: z.array(z.string().uuid()).min(1, "至少选择一个商品"),
  receiverName: z.string().trim().min(1, "请填写收货人").max(50),
  receiverContact: z.string().trim().min(1, "请填写联系方式").max(100),
  receiverAddress: z.string().trim().min(1, "请填写收货地址").max(300),
  userNote: z.string().trim().max(500).optional().nullable()
});

export const orderStatusUpdateSchema = z.object({
  status: z.enum(orderStatuses),
  note: z.string().trim().max(500).optional().nullable()
});

export const paymentStatusUpdateSchema = z.object({
  paymentStatus: z.enum(paymentStatuses),
  note: z.string().trim().max(500).optional().nullable()
});

export const shippingUpdateSchema = z.object({
  shippingCompany: z.string().trim().max(100).optional().nullable(),
  shippingNo: z.string().trim().max(100).optional().nullable()
});

export const orderNotesUpdateSchema = z.object({
  adminNote: z.string().trim().max(2000).optional().nullable(),
  publicNote: z.string().trim().max(1000).optional().nullable()
});
