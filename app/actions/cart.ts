"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ActionState } from "@/lib/action-state";
import { errorState } from "@/lib/action-state";
import { compactText } from "@/lib/utils";
import { requireApiUser } from "@/server/auth";
import { addCartItem, clearCart, removeCartItem, updateCartItem } from "@/server/services/cart";

function safeRedirect(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/products";
}

export async function addToCartAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const redirectTo = safeRedirect(compactText(formData.get("redirect")));
  let user;
  try {
    user = await requireApiUser();
  } catch {
    redirect(`/login?redirect=${encodeURIComponent(redirectTo)}`);
  }

  try {
    await addCartItem(user.id, {
      productId: formData.get("productId"),
      variantId: formData.get("variantId"),
      quantity: formData.get("quantity")
    });
    revalidatePath("/cart");
    return { ok: true, message: "已加入购物车" };
  } catch (error) {
    return errorState(error);
  }
}

export async function updateCartItemAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireApiUser();
  try {
    await updateCartItem(user.id, {
      cartItemId: formData.get("cartItemId"),
      quantity: formData.get("quantity")
    });
    revalidatePath("/cart");
    return { ok: true, message: "购物车已更新" };
  } catch (error) {
    return errorState(error);
  }
}

export async function removeCartItemAction(formData: FormData) {
  const user = await requireApiUser();
  await removeCartItem(user.id, compactText(formData.get("cartItemId")));
  revalidatePath("/cart");
}

export async function clearCartAction() {
  const user = await requireApiUser();
  await clearCart(user.id);
  revalidatePath("/cart");
}
