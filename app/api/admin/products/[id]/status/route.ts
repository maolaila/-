import { NextRequest } from "next/server";

import { requireApiAdmin } from "@/server/auth";
import { jsonError, jsonOk } from "@/server/http";
import { updateProductStatus } from "@/server/services/catalog";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiAdmin();
    await updateProductStatus((await params).id, await request.json());
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
