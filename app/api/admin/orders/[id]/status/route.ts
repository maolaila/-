import { NextRequest } from "next/server";

import { requireApiAdmin } from "@/server/auth";
import { jsonError, jsonOk } from "@/server/http";
import { updateOrderStatus } from "@/server/services/orders";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireApiAdmin();
    await updateOrderStatus(admin.id, (await params).id, await request.json());
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
