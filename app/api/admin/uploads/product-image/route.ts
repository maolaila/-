import { NextRequest } from "next/server";

import { requireApiAdmin } from "@/server/auth";
import { jsonError, jsonOk } from "@/server/http";
import { uploadProductImage } from "@/server/services/storage";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    await requireApiAdmin();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new Error("请选择图片文件");
    }
    const usage = form.get("usage");
    if (usage !== "thumbnail" && usage !== "detail") {
      throw new Error("请选择图片用途");
    }
    return jsonOk(await uploadProductImage(file, usage), { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
