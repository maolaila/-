import "server-only";

import { getSql } from "@/db/client";
import { addCartItemSchema, updateCartItemSchema } from "@/lib/validators/cart";

export type CartItemRow = {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  productSlug: string;
  productStatus: string;
  mainImageUrl: string;
  optionValues: Record<string, string>;
  variantStatus: string;
  unitPrice: string;
  stock: number;
  quantity: number;
  subtotal: string;
};

export async function getCartItems(userId: string) {
  const sql = getSql();
  return sql<CartItemRow[]>`
    select
      ci.id,
      ci.product_id as "productId",
      ci.variant_id as "variantId",
      p.name as "productName",
      p.slug as "productSlug",
      p.status as "productStatus",
      p.main_image_url as "mainImageUrl",
      v.option_values as "optionValues",
      v.status as "variantStatus",
      v.price::text as "unitPrice",
      v.stock,
      ci.quantity,
      (v.price * ci.quantity)::text as "subtotal"
    from cart_items ci
    join products p on p.id = ci.product_id
    join product_variants v on v.id = ci.variant_id
    where ci.user_id = ${userId}
    order by ci.created_at desc
  `;
}

export async function addCartItem(userId: string, input: unknown) {
  const parsed = addCartItemSchema.parse(input);
  const sql = getSql();

  const variants = await sql<{ productStatus: string; variantStatus: string; stock: number }[]>`
    select p.status as "productStatus", v.status as "variantStatus", v.stock
    from product_variants v
    join products p on p.id = v.product_id
    where v.id = ${parsed.variantId}
      and p.id = ${parsed.productId}
    limit 1
  `;

  const variant = variants[0];
  if (!variant || variant.productStatus !== "active" || variant.variantStatus !== "active") {
    throw new Error("商品已下架或规格不可用");
  }
  if (variant.stock < parsed.quantity) {
    throw new Error("库存不足");
  }

  await sql`
    insert into cart_items (user_id, product_id, variant_id, quantity)
    values (${userId}, ${parsed.productId}, ${parsed.variantId}, ${parsed.quantity})
    on conflict (user_id, variant_id)
    do update set
      quantity = least(cart_items.quantity + excluded.quantity, ${Math.min(99, variant.stock)}),
      updated_at = now()
  `;
}

export async function updateCartItem(userId: string, input: unknown) {
  const parsed = updateCartItemSchema.parse(input);
  const sql = getSql();
  const rows = await sql<{ stock: number }[]>`
    select v.stock
    from cart_items ci
    join product_variants v on v.id = ci.variant_id
    where ci.id = ${parsed.cartItemId}
      and ci.user_id = ${userId}
    limit 1
  `;

  if (rows.length === 0) {
    throw new Error("购物车商品不存在");
  }
  if (parsed.quantity > rows[0].stock) {
    throw new Error("库存不足，请调整数量");
  }

  await sql`
    update cart_items
    set quantity = ${parsed.quantity}, updated_at = now()
    where id = ${parsed.cartItemId}
      and user_id = ${userId}
  `;
}

export async function removeCartItem(userId: string, cartItemId: string) {
  const sql = getSql();
  await sql`delete from cart_items where id = ${cartItemId} and user_id = ${userId}`;
}

export async function clearCart(userId: string) {
  const sql = getSql();
  await sql`delete from cart_items where user_id = ${userId}`;
}
