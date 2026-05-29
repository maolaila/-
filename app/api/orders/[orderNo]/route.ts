import { requireApiUser } from "@/server/auth";
import { jsonError, jsonOk } from "@/server/http";
import { getOrderDetailByNo } from "@/server/services/orders";

export async function GET(_request: Request, { params }: { params: Promise<{ orderNo: string }> }) {
  try {
    const user = await requireApiUser();
    const order = await getOrderDetailByNo(user.id, (await params).orderNo);
    if (!order) {
      return jsonOk({ error: "订单不存在" }, { status: 404 });
    }
    return jsonOk({ order });
  } catch (error) {
    return jsonError(error);
  }
}
