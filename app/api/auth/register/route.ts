import { NextRequest } from "next/server";

import { registerCustomer } from "@/server/auth";
import { jsonError, jsonOk } from "@/server/http";

export async function POST(request: NextRequest) {
  try {
    const id = await registerCustomer(await request.json());
    return jsonOk({ id }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
