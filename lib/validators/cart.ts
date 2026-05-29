import { z } from "zod";

export const addCartItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(99)
});

export const updateCartItemSchema = z.object({
  cartItemId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(99)
});
