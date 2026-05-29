import { NextRequest } from "next/server";

import { requireApiUser } from "@/server/auth";
import { jsonError, jsonOk } from "@/server/http";
import { removeCartItem, updateCartItem } from "@/server/services/cart";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiUser();
    await updateCartItem(user.id, { ...(await request.json()), cartItemId: (await params).id });
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiUser();
    await removeCartItem(user.id, (await params).id);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
