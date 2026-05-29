"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ActionState } from "@/lib/action-state";
import { errorState } from "@/lib/action-state";
import { compactText } from "@/lib/utils";
import { requireApiUser } from "@/server/auth";
import { createOrderFromCart } from "@/server/services/orders";

export async function createOrderAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireApiUser();
  let orderNo: string;

  try {
    orderNo = await createOrderFromCart(user.id, {
      cartItemIds: formData.getAll("cartItemIds").map(String),
      receiverName: compactText(formData.get("receiverName")),
      receiverContact: compactText(formData.get("receiverContact")),
      receiverAddress: compactText(formData.get("receiverAddress")),
      userNote: compactText(formData.get("userNote"))
    });
  } catch (error) {
    return errorState(error);
  }

  revalidatePath("/cart");
  revalidatePath("/orders");
  redirect(`/orders/${orderNo}`);
}
