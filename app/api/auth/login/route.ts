import { NextRequest } from "next/server";

import { loginUser } from "@/server/auth";
import { jsonError, jsonOk } from "@/server/http";

export async function POST(request: NextRequest) {
  try {
    const id = await loginUser(await request.json());
    return jsonOk({ id });
  } catch (error) {
    return jsonError(error);
  }
}
