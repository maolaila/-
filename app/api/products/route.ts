import { NextRequest } from "next/server";

import { getPublicProducts } from "@/server/services/catalog";
import { jsonError, jsonOk } from "@/server/http";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const products = await getPublicProducts({
      category: searchParams.get("category") ?? undefined,
      q: searchParams.get("q") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
      stock: searchParams.get("stock") ?? undefined
    });
    return jsonOk({ products });
  } catch (error) {
    return jsonError(error);
  }
}
