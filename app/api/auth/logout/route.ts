import { clearCurrentSession } from "@/server/auth";
import { jsonOk } from "@/server/http";

export async function POST() {
  await clearCurrentSession();
  return jsonOk({ ok: true });
}
