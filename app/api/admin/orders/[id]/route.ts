import { requireApiAdmin } from "@/server/auth";
import { jsonError, jsonOk } from "@/server/http";
import { getOrderDetailById } from "@/server/services/orders";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiAdmin();
    const order = await getOrderDetailById((await params).id);
    if (!order) {
      return jsonOk({ error: "订单不存在" }, { status: 404 });
    }
    return jsonOk({ order });
  } catch (error) {
    return jsonError(error);
  }
}
