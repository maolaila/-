import "server-only";

import { getSql } from "@/db/client";
import type { OrderStatus, PaymentStatus } from "@/db/schema";
import { assertValidOrderTransition } from "@/lib/order/status";
import {
  checkoutSchema,
  orderNotesUpdateSchema,
  orderStatusUpdateSchema,
  paymentStatusUpdateSchema,
  shippingUpdateSchema
} from "@/lib/validators/order";

export type OrderListRow = {
  id: string;
  orderNo: string;
  username: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: string;
  receiverName: string;
  receiverContact: string;
  itemCount: number;
  createdAt: string;
};

export type OrderItemRow = {
  id: string;
  productName: string;
  productSlug: string;
  productImageUrl: string;
  variantSnapshot: Record<string, string>;
  unitPrice: string;
  quantity: number;
  subtotal: string;
};

export type OrderLogRow = {
  id: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  operatorName: string | null;
  note: string | null;
  createdAt: string;
};

export type OrderDetail = {
  id: string;
  orderNo: string;
  userId: string;
  username: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: string;
  receiverName: string;
  receiverContact: string;
  receiverAddress: string;
  userNote: string | null;
  adminNote: string | null;
  publicNote: string | null;
  shippingCompany: string | null;
  shippingNo: string | null;
  createdAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
  items: OrderItemRow[];
  logs: OrderLogRow[];
};

function orderNo() {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0")
  ].join("");
  return `LC${stamp}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function createOrderFromCart(userId: string, input: unknown) {
  const parsed = checkoutSchema.parse(input);
  const selected = new Set(parsed.cartItemIds);
  const sql = getSql();

  return sql.begin(async (tx) => {
    const cartRows = await tx<
      {
        cartItemId: string;
        productId: string;
        variantId: string;
        quantity: number;
        productName: string;
        productSlug: string;
        productStatus: string;
        productImageUrl: string;
        variantStatus: string;
        optionValues: Record<string, string>;
        unitPrice: string;
        stock: number;
      }[]
    >`
      select
        ci.id as "cartItemId",
        ci.product_id as "productId",
        ci.variant_id as "variantId",
        ci.quantity,
        p.name as "productName",
        p.slug as "productSlug",
        p.status as "productStatus",
        p.main_image_url as "productImageUrl",
        v.status as "variantStatus",
        v.option_values as "optionValues",
        v.price::text as "unitPrice",
        v.stock
      from cart_items ci
      join products p on p.id = ci.product_id
      join product_variants v on v.id = ci.variant_id
      where ci.user_id = ${userId}
      order by ci.created_at asc
      for update
    `;

    const rows = cartRows.filter((row) => selected.has(row.cartItemId));
    if (rows.length !== parsed.cartItemIds.length || rows.length === 0) {
      throw new Error("购物车商品不存在或已变化");
    }

    let total = 0;
    for (const row of rows) {
      if (row.productStatus !== "active") {
        throw new Error(`${row.productName} 已下架，不能提交订单`);
      }
      if (row.variantStatus !== "active") {
        throw new Error(`${row.productName} 规格不可用`);
      }
      if (row.stock < row.quantity) {
        throw new Error(`${row.productName} 库存不足`);
      }
      total += Number(row.unitPrice) * row.quantity;
    }

    const [order] = await tx<{ id: string; orderNo: string }[]>`
      insert into orders (
        order_no, user_id, status, payment_status, total_amount,
        receiver_name, receiver_contact, receiver_address, user_note
      )
      values (
        ${orderNo()}, ${userId}, 'pending_confirm', 'unpaid', ${total.toFixed(2)},
        ${parsed.receiverName}, ${parsed.receiverContact}, ${parsed.receiverAddress},
        ${parsed.userNote || null}
      )
      returning id, order_no as "orderNo"
    `;

    for (const row of rows) {
      const subtotal = Number(row.unitPrice) * row.quantity;
      const updated = await tx<{ id: string }[]>`
        update product_variants
        set stock = stock - ${row.quantity}, updated_at = now()
        where id = ${row.variantId}
          and stock >= ${row.quantity}
        returning id
      `;
      if (updated.length === 0) {
        throw new Error(`${row.productName} 库存不足`);
      }

      await tx`
        insert into order_items (
          order_id, product_id, variant_id, product_name, product_slug, product_image_url,
          variant_snapshot, unit_price, quantity, subtotal
        )
        values (
          ${order.id}, ${row.productId}, ${row.variantId}, ${row.productName}, ${row.productSlug},
          ${row.productImageUrl}, ${tx.json(row.optionValues)}, ${row.unitPrice},
          ${row.quantity}, ${subtotal.toFixed(2)}
        )
      `;
    }

    await tx`
      delete from cart_items
      where user_id = ${userId}
        and id in ${tx(rows.map((row) => row.cartItemId))}
    `;

    await tx`
      insert into order_status_logs (order_id, from_status, to_status, operator_id, note)
      values (${order.id}, null, 'pending_confirm', ${userId}, '顾客提交订单')
    `;

    return order.orderNo;
  });
}

export async function getCustomerOrders(userId: string, status?: OrderStatus | "all") {
  const sql = getSql();
  const statusFilter = status && status !== "all" ? status : null;
  return sql<OrderListRow[]>`
    select
      o.id,
      o.order_no as "orderNo",
      u.username,
      o.status,
      o.payment_status as "paymentStatus",
      o.total_amount::text as "totalAmount",
      o.receiver_name as "receiverName",
      o.receiver_contact as "receiverContact",
      coalesce(sum(oi.quantity), 0)::int as "itemCount",
      o.created_at::text as "createdAt"
    from orders o
    join users u on u.id = o.user_id
    left join order_items oi on oi.order_id = o.id
    where o.user_id = ${userId}
      and (${statusFilter}::text is null or o.status = ${statusFilter})
    group by o.id, u.id
    order by o.created_at desc
  `;
}

export async function getAdminOrders(params: {
  q?: string;
  status?: OrderStatus | "all";
  paymentStatus?: PaymentStatus | "all";
}) {
  const sql = getSql();
  const q = params.q?.trim() || null;
  const status = params.status && params.status !== "all" ? params.status : null;
  const paymentStatus =
    params.paymentStatus && params.paymentStatus !== "all" ? params.paymentStatus : null;

  return sql<OrderListRow[]>`
    select
      o.id,
      o.order_no as "orderNo",
      u.username,
      o.status,
      o.payment_status as "paymentStatus",
      o.total_amount::text as "totalAmount",
      o.receiver_name as "receiverName",
      o.receiver_contact as "receiverContact",
      coalesce(sum(oi.quantity), 0)::int as "itemCount",
      o.created_at::text as "createdAt"
    from orders o
    join users u on u.id = o.user_id
    left join order_items oi on oi.order_id = o.id
    where (${q}::text is null or o.order_no ilike '%' || ${q} || '%' or u.username ilike '%' || ${q} || '%' or o.receiver_contact ilike '%' || ${q} || '%')
      and (${status}::text is null or o.status = ${status})
      and (${paymentStatus}::text is null or o.payment_status = ${paymentStatus})
    group by o.id, u.id
    order by o.created_at desc
    limit 100
  `;
}

export async function getOrderDetailByNo(userId: string, orderNoValue: string) {
  const detail = await getOrderDetail({ orderNo: orderNoValue, userId });
  return detail;
}

export async function getOrderDetailById(id: string) {
  return getOrderDetail({ id });
}

async function getOrderDetail(filter: { id?: string; orderNo?: string; userId?: string }) {
  const sql = getSql();
  const rows = await sql<Omit<OrderDetail, "items" | "logs">[]>`
    select
      o.id,
      o.order_no as "orderNo",
      o.user_id as "userId",
      u.username,
      o.status,
      o.payment_status as "paymentStatus",
      o.total_amount::text as "totalAmount",
      o.receiver_name as "receiverName",
      o.receiver_contact as "receiverContact",
      o.receiver_address as "receiverAddress",
      o.user_note as "userNote",
      o.admin_note as "adminNote",
      o.public_note as "publicNote",
      o.shipping_company as "shippingCompany",
      o.shipping_no as "shippingNo",
      o.created_at::text as "createdAt",
      o.completed_at::text as "completedAt",
      o.cancelled_at::text as "cancelledAt"
    from orders o
    join users u on u.id = o.user_id
    where (${filter.id ?? null}::uuid is null or o.id = ${filter.id ?? null})
      and (${filter.orderNo ?? null}::text is null or o.order_no = ${filter.orderNo ?? null})
      and (${filter.userId ?? null}::uuid is null or o.user_id = ${filter.userId ?? null})
    limit 1
  `;

  const order = rows[0];
  if (!order) {
    return null;
  }

  const items = await sql<OrderItemRow[]>`
    select
      id,
      product_name as "productName",
      product_slug as "productSlug",
      product_image_url as "productImageUrl",
      variant_snapshot as "variantSnapshot",
      unit_price::text as "unitPrice",
      quantity,
      subtotal::text
    from order_items
    where order_id = ${order.id}
    order by created_at asc
  `;

  const logs = await sql<OrderLogRow[]>`
    select
      l.id,
      l.from_status as "fromStatus",
      l.to_status as "toStatus",
      u.username as "operatorName",
      l.note,
      l.created_at::text as "createdAt"
    from order_status_logs l
    left join users u on u.id = l.operator_id
    where l.order_id = ${order.id}
    order by l.created_at asc
  `;

  return { ...order, items, logs } satisfies OrderDetail;
}

export async function updateOrderStatus(adminId: string, id: string, input: unknown) {
  const parsed = orderStatusUpdateSchema.parse(input);
  const sql = getSql();

  await sql.begin(async (tx) => {
    const rows = await tx<{ status: OrderStatus }[]>`
      select status from orders where id = ${id} for update
    `;
    if (rows.length === 0) {
      throw new Error("订单不存在");
    }
    const from = rows[0].status;
    assertValidOrderTransition(from, parsed.status);

    await tx`
      update orders
      set status = ${parsed.status},
          updated_at = now(),
          completed_at = case when ${parsed.status} = 'completed' then now() else completed_at end,
          cancelled_at = case when ${parsed.status} = 'cancelled' then now() else cancelled_at end
      where id = ${id}
    `;

    await tx`
      insert into order_status_logs (order_id, from_status, to_status, operator_id, note)
      values (${id}, ${from}, ${parsed.status}, ${adminId}, ${parsed.note || null})
    `;
  });
}

export async function updatePaymentStatus(id: string, input: unknown) {
  const parsed = paymentStatusUpdateSchema.parse(input);
  const sql = getSql();
  if (parsed.note) {
    await sql`
      update orders
      set payment_status = ${parsed.paymentStatus},
          admin_note = concat_ws(E'\n', admin_note, ${parsed.note}),
          updated_at = now()
      where id = ${id}
    `;
    return;
  }

  await sql`
    update orders
    set payment_status = ${parsed.paymentStatus},
        updated_at = now()
    where id = ${id}
  `;
}

export async function updateShipping(id: string, input: unknown) {
  const parsed = shippingUpdateSchema.parse(input);
  const sql = getSql();
  await sql`
    update orders
    set shipping_company = ${parsed.shippingCompany || null},
        shipping_no = ${parsed.shippingNo || null},
        updated_at = now()
    where id = ${id}
  `;
}

export async function updateOrderNotes(id: string, input: unknown) {
  const parsed = orderNotesUpdateSchema.parse(input);
  const sql = getSql();
  await sql`
    update orders
    set admin_note = ${parsed.adminNote || null},
        public_note = ${parsed.publicNote || null},
        updated_at = now()
    where id = ${id}
  `;
}

export async function getDashboardStats() {
  const sql = getSql();
  const [stats] = await sql<
    {
      todayOrders: number;
      pendingOrders: number;
      exceptionOrders: number;
      activeProducts: number;
      soldOutVariants: number;
      customers: number;
    }[]
  >`
    select
      (select count(*)::int from orders where created_at::date = now()::date) as "todayOrders",
      (select count(*)::int from orders where status = 'pending_confirm') as "pendingOrders",
      (select count(*)::int from orders where status = 'exception') as "exceptionOrders",
      (select count(*)::int from products where status = 'active') as "activeProducts",
      (select count(*)::int from product_variants where stock = 0) as "soldOutVariants",
      (select count(*)::int from users where role = 'customer') as "customers"
  `;

  const recentOrders = await getAdminOrders({});
  return { stats, recentOrders: recentOrders.slice(0, 10) };
}
