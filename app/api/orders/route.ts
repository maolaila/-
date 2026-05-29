import { NextRequest } from "next/server";

import { requireApiUser } from "@/server/auth";
import { jsonError, jsonOk } from "@/server/http";
import { createOrderFromCart, getCustomerOrders } from "@/server/services/orders";

export async function GET() {
  try {
    const user = await requireApiUser();
    return jsonOk({ orders: await getCustomerOrders(user.id) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser();
    const orderNo = await createOrderFromCart(user.id, await request.json());
    return jsonOk({ orderNo }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
