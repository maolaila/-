import crypto from "node:crypto";

import { SESSION_TTL_SECONDS } from "@/lib/auth/constants";

export { SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/lib/auth/constants";

export function createSessionToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string) {
  const secret = process.env.SESSION_SECRET ?? "dev-session-secret";
  return crypto.createHash("sha256").update(`${token}.${secret}`).digest("hex");
}

export function sessionExpiresAt() {
  return new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
}
