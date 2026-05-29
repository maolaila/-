import { NextRequest } from "next/server";

import { requireApiAdmin } from "@/server/auth";
import { jsonError, jsonOk } from "@/server/http";
import { deleteCategory, updateCategory } from "@/server/services/catalog";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiAdmin();
    await updateCategory((await params).id, await request.json());
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiAdmin();
    await deleteCategory((await params).id);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
