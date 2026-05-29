import { NextRequest } from "next/server";

import { requireApiAdmin } from "@/server/auth";
import { jsonError, jsonOk } from "@/server/http";
import { createProduct, getAdminProducts } from "@/server/services/catalog";

export async function GET(request: NextRequest) {
  try {
    await requireApiAdmin();
    const searchParams = request.nextUrl.searchParams;
    return jsonOk({
      products: await getAdminProducts({
        q: searchParams.get("q") ?? undefined,
        categoryId: searchParams.get("categoryId") ?? undefined,
        status: (searchParams.get("status") as "all") ?? "all"
      })
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireApiAdmin();
    const id = await createProduct(await request.json());
    return jsonOk({ id }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
