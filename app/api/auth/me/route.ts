import { jsonOk } from "@/server/http";
import { getCurrentUser } from "@/server/auth";

export async function GET() {
  return jsonOk({ user: await getCurrentUser() });
}
