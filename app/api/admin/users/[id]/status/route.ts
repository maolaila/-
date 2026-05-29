import { NextRequest } from "next/server";

import type { UserStatus } from "@/db/schema";
import { requireApiAdmin } from "@/server/auth";
import { jsonError, jsonOk } from "@/server/http";
import { setCustomerStatus } from "@/server/services/users";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiAdmin();
    const body = (await request.json()) as { status: UserStatus };
    await setCustomerStatus((await params).id, body.status);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
