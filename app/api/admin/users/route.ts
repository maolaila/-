import { NextRequest } from "next/server";

import { requireApiAdmin } from "@/server/auth";
import { jsonError, jsonOk } from "@/server/http";
import { getCustomers } from "@/server/services/users";

export async function GET(request: NextRequest) {
  try {
    await requireApiAdmin();
    return jsonOk({ users: await getCustomers(request.nextUrl.searchParams.get("q") ?? undefined) });
  } catch (error) {
    return jsonError(error);
  }
}
