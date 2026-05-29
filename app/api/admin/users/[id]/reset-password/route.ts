import { NextRequest } from "next/server";

import { requireApiAdmin } from "@/server/auth";
import { jsonError, jsonOk } from "@/server/http";
import { resetCustomerPassword } from "@/server/services/users";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiAdmin();
    const body = (await request.json()) as { password: string };
    await resetCustomerPassword({ userId: (await params).id, password: body.password });
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
