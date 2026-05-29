import { NextRequest } from "next/server";

import { requireApiAdmin } from "@/server/auth";
import { jsonError, jsonOk } from "@/server/http";
import { createCategory, getAdminCategories } from "@/server/services/catalog";

export async function GET() {
  try {
    await requireApiAdmin();
    return jsonOk({ categories: await getAdminCategories() });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireApiAdmin();
    const id = await createCategory(await request.json());
    return jsonOk({ id }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
