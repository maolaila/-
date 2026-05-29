import { NextRequest } from "next/server";

import { requireApiAdmin } from "@/server/auth";
import { jsonError, jsonOk } from "@/server/http";
import { deleteProduct, getProductForAdmin, updateProduct } from "@/server/services/catalog";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiAdmin();
    const product = await getProductForAdmin((await params).id);
    if (!product) {
      return jsonOk({ error: "商品不存在" }, { status: 404 });
    }
    return jsonOk({ product });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiAdmin();
    await updateProduct((await params).id, await request.json());
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiAdmin();
    return jsonOk({ result: await deleteProduct((await params).id) });
  } catch (error) {
    return jsonError(error);
  }
}
