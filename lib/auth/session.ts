import crypto from "node:crypto";

import { SESSION_TTL_SECONDS } from "@/lib/auth/constants";
import { requiredSecret } from "@/lib/env";

export { SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/lib/auth/constants";

export function createSessionToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string) {
  const secret = requiredSecret("SESSION_SECRET", "dev-session-secret", 32);
  return crypto.createHash("sha256").update(`${token}.${secret}`).digest("hex");
}

export function sessionExpiresAt() {
  return new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
}
