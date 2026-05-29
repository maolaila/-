import { NextRequest } from "next/server";

import type { OrderStatus, PaymentStatus } from "@/db/schema";
import { requireApiAdmin } from "@/server/auth";
import { jsonError, jsonOk } from "@/server/http";
import { getAdminOrders } from "@/server/services/orders";

export async function GET(request: NextRequest) {
  try {
    await requireApiAdmin();
    const searchParams = request.nextUrl.searchParams;
    return jsonOk({
      orders: await getAdminOrders({
        q: searchParams.get("q") ?? undefined,
        status: (searchParams.get("status") as OrderStatus | "all" | null) ?? "all",
        paymentStatus: (searchParams.get("paymentStatus") as PaymentStatus | "all" | null) ?? "all"
      })
    });
  } catch (error) {
    return jsonError(error);
  }
}
