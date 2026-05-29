import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getSql } from "@/db/client";
import type { UserRole, UserStatus } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  createSessionToken,
  hashSessionToken,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  sessionExpiresAt
} from "@/lib/auth/session";
import { loginSchema, registerSchema } from "@/lib/validators/auth";
import { normalizeUsername } from "@/lib/utils";

export type CurrentUser = {
  id: string;
  username: string;
  normalizedUsername: string;
  role: UserRole;
  status: UserStatus;
};

export class AuthFailure extends Error {
  status = 401;
}

export class ForbiddenFailure extends Error {
  status = 403;
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS
  };
}

export async function setSessionCookie(userId: string) {
  const sql = getSql();
  const token = createSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = sessionExpiresAt();

  await sql`
    insert into sessions (user_id, token_hash, expires_at)
    values (${userId}, ${tokenHash}, ${expiresAt})
  `;

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, cookieOptions());
}

export async function clearCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    const sql = getSql();
    await sql`delete from sessions where token_hash = ${hashSessionToken(token)}`;
  }

  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  const sql = getSql();
  const tokenHash = hashSessionToken(token);
  const rows = await sql<CurrentUser[]>`
    select
      u.id,
      u.username,
      u.normalized_username as "normalizedUsername",
      u.role,
      u.status
    from sessions s
    join users u on u.id = s.user_id
    where s.token_hash = ${tokenHash}
      and s.expires_at > now()
      and u.status = 'active'
    limit 1
  `;

  if (rows.length === 0) {
    return null;
  }

  await sql`update sessions set last_used_at = now() where token_hash = ${tokenHash}`;
  return rows[0];
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/admin/login");
  }
  if (user.role !== "admin") {
    throw new ForbiddenFailure("需要管理员权限");
  }
  return user;
}

export async function requireApiUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthFailure("请先登录");
  }
  return user;
}

export async function requireApiAdmin() {
  const user = await requireApiUser();
  if (user.role !== "admin") {
    throw new ForbiddenFailure("需要管理员权限");
  }
  return user;
}

export async function registerCustomer(input: unknown) {
  const parsed = registerSchema.parse(input);
  const normalizedUsername = normalizeUsername(parsed.username);
  const passwordHash = await hashPassword(parsed.password);
  const sql = getSql();

  const rows = await sql<{ id: string }[]>`
    insert into users (username, normalized_username, password_hash, role, status)
    values (${parsed.username.trim()}, ${normalizedUsername}, ${passwordHash}, 'customer', 'active')
    returning id
  `.catch((error) => {
    if (String(error?.message ?? "").includes("users_normalized_username")) {
      throw new Error("账号已存在");
    }
    if (String(error?.message ?? "").includes("users_normalized_username_uidx")) {
      throw new Error("账号已存在");
    }
    throw error;
  });

  await setSessionCookie(rows[0].id);
  return rows[0].id;
}

export async function loginUser(input: unknown, requiredRole?: UserRole) {
  const parsed = loginSchema.parse(input);
  const normalizedUsername = normalizeUsername(parsed.username);
  const sql = getSql();
  const rows = await sql<
    {
      id: string;
      passwordHash: string;
      role: UserRole;
      status: UserStatus;
    }[]
  >`
    select id, password_hash as "passwordHash", role, status
    from users
    where normalized_username = ${normalizedUsername}
    limit 1
  `;

  const user = rows[0];
  const valid = user ? await verifyPassword(parsed.password, user.passwordHash) : false;

  if (!user || !valid || user.status !== "active") {
    throw new Error("账号或密码错误");
  }

  if (requiredRole && user.role !== requiredRole) {
    throw new Error("账号或密码错误");
  }

  await sql`update users set last_login_at = now(), updated_at = now() where id = ${user.id}`;
  await setSessionCookie(user.id);
  return user.id;
}

export async function deleteUserSessions(userId: string) {
  const sql = getSql();
  await sql`delete from sessions where user_id = ${userId}`;
}
