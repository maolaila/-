import { NextRequest } from "next/server";

import { requireApiAdmin } from "@/server/auth";
import { jsonError, jsonOk } from "@/server/http";
import { getSiteSettings, updateSiteSettings } from "@/server/services/settings";

export async function GET() {
  try {
    await requireApiAdmin();
    return jsonOk({ settings: await getSiteSettings() });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireApiAdmin();
    return jsonOk({ settings: await updateSiteSettings(await request.json()) });
  } catch (error) {
    return jsonError(error);
  }
}
