import { NextRequest } from "next/server";

import { requireApiUser } from "@/server/auth";
import { jsonError, jsonOk } from "@/server/http";
import { addCartItem, getCartItems } from "@/server/services/cart";

export async function GET() {
  try {
    const user = await requireApiUser();
    return jsonOk({ items: await getCartItems(user.id) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser();
    await addCartItem(user.id, await request.json());
    return jsonOk({ ok: true }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
